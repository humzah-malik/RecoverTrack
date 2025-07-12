#!/usr/bin/env python3
# backend/scripts/train_recovery_lr.py
import json, numpy as np, pandas as pd
from pathlib import Path
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import torch
from torch import nn
from torch.utils.data import TensorDataset, DataLoader

df = pd.read_csv("recovery_dataset.csv", parse_dates=["date"])
df.drop_duplicates(['user_id','date'], keep='last', inplace=True)
df = df[
    (df["protein_pct"].lt(300) | df["protein_pct"].isna()) &
    (df["carbs_pct"].lt(300)   | df["carbs_pct"].isna()) &
    (df["fat_pct"].lt(300)     | df["fat_pct"].isna())
]
df = df.dropna(subset=["recovery_rating"])
df.sort_values(["user_id","date"], inplace=True)
for f in ("soreness","stress","sleep_quality"):
    df[f"{f}_roll3"] = df.groupby("user_id")[f].transform(lambda x: x.rolling(3,min_periods=1).mean())
df["dow"] = df["date"].dt.dayofweek
df["moy"] = df["date"].dt.month - 1
df["dow_sin"] = np.sin(2*np.pi*df["dow"]/7)
df["dow_cos"] = np.cos(2*np.pi*df["dow"]/7)
df["moy_sin"] = np.sin(2*np.pi*df["moy"]/12)
df["moy_cos"] = np.cos(2*np.pi*df["moy"]/12)
all_muscles = sorted({m for grp in df["muscle_groups"].dropna() for m in json.loads(grp)})
joblib.dump(all_muscles, Path("app/recovery_all_muscles.pkl"))
for m in all_muscles:
    df[m] = df["muscle_groups"].apply(lambda s: 1 if pd.notnull(s) and m in json.loads(s) else 0)
df.drop(columns=["muscle_groups","date","dow","moy"], inplace=True)

target = "recovery_rating"
num_feats = [
    "sleep_h","sleep_quality","resting_hr","hrv",
    "total_sets","failure_sets","total_rir",
    "cal_deficit_pct","protein_pct","carbs_pct","fat_pct",
    "stress","motivation","water_intake_l","age","height","weight"
] + [f"{f}_roll3" for f in ("soreness","stress","sleep_quality")] + ["dow_sin","dow_cos","moy_sin","moy_cos"] + all_muscles
cat_feats = ["sex","goal","activity_level","split_type"]

X = df[num_feats + cat_feats]
y = df[target].values
groups = df["user_id"].values

gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, val_idx = next(gss.split(X, y, groups))
df_tr = df.iloc[train_idx].copy()
df_va = df.iloc[val_idx].copy()

user_means = df_tr.groupby("user_id")[target].mean()
global_mean = df_tr[target].mean()
joblib.dump(global_mean, Path("app/recovery_global_mean.pkl"))
df_tr["user_bias"] = df_tr["user_id"].map(user_means)
df_va["user_bias"] = df_va["user_id"].map(user_means).fillna(global_mean)

num_feats2 = num_feats + ["user_bias"]
Xtr = df_tr[num_feats2 + cat_feats]
ytr = df_tr[target].values
Xva = df_va[num_feats2 + cat_feats]
yva = df_va[target].values

numeric_pipe = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())])
preproc = ColumnTransformer([
    ("num", numeric_pipe, num_feats2),
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_feats),
])
preproc.fit(Xtr)
X_tr_np = preproc.transform(Xtr).astype(np.float32)
X_va_np = preproc.transform(Xva).astype(np.float32)

y_mean, y_std = ytr.mean(), ytr.std()
joblib.dump(y_mean, Path("app/recovery_y_mean.pkl"))
joblib.dump(y_std,  Path("app/recovery_y_std.pkl"))
y_tr_norm = (ytr - y_mean) / y_std

class MLP(nn.Module):
    def __init__(self, dim, h):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, h),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(h, 1),
        )
    def forward(self, x):
        return self.net(x).squeeze(1)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
ds = TensorDataset(torch.from_numpy(X_tr_np), torch.from_numpy(y_tr_norm.astype(np.float32)))
loader = DataLoader(ds, batch_size=32, shuffle=True)

model = MLP(X_tr_np.shape[1], h=32).to(device)
opt = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
loss_fn = nn.MSELoss()

best_mae, no_imp = float("inf"), 0
for epoch in range(1, 201):
    model.train()
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        opt.zero_grad()
        loss_fn(model(xb), yb).backward()
        opt.step()
    if epoch % 10 == 0:
        model.eval()
        with torch.no_grad():
            preds = model(torch.from_numpy(X_va_np).to(device)).cpu().numpy()
        preds = preds * y_std + y_mean
        mae = mean_absolute_error(yva, preds)
        print(f"Epoch {epoch:03d} → VAL MAE: {mae:.3f}")
        if mae < best_mae:
            best_mae, no_imp, best_state = mae, 0, model.state_dict()
        else:
            no_imp += 1
            if no_imp >= 5:
                break

model.load_state_dict(best_state)
model.eval()
with torch.no_grad():
    tr_pred_norm = model(torch.from_numpy(X_tr_np).to(device)).cpu().numpy()

tr_pred = tr_pred_norm * y_std + y_mean
df_tr["residual"] = ytr - tr_pred

# 2.  For now we only learn a bias (average residual).  Slope = 1.0.
user_heads = (
    df_tr.groupby("user_id")["residual"]
         .mean()
         .reset_index(name="bias")
         .assign(slope=1.0)                    # placeholder column
)

# 3.  Save to CSV so the GH Action can upsert into Supabase
heads_path = Path("user_recovery_heads.csv")
user_heads.to_csv(heads_path, index=False)
print(f"✨ wrote {len(user_heads)} per-user heads → {heads_path}")

joblib.dump(preproc, Path("app/recovery_preproc_with_user_bias.joblib"))
torch.save(best_state, Path("app/recovery_mlp_with_user_bias.pt"))