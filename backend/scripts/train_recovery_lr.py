# scripts/train_recovery_lr.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
import joblib

# 1) Load & filter dataset
df = pd.read_csv("recovery_dataset.csv")
df = df.dropna(subset=["recovery_rating"])
if df.empty:
    raise RuntimeError("No labeled rows found!  Populate `recovery_rating` first.")

# 2) Define features & target
target = "recovery_rating"
numeric_feats = [
    "sleep_h","sleep_quality","resting_hr","hrv",
    "trained","total_sets","failure_sets","total_rir",
    "cal_deficit_pct","protein_pct","carbs_pct","fat_pct",
    "stress","motivation","water_intake_l",
    "age","height","weight"
]
categorical_feats = ["sex","goal","activity_level"]

X = df[numeric_feats + categorical_feats]
y = df[target]

# 3) Train/validation split
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 4) Preprocessing pipeline
numeric_pipeline = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale",  StandardScaler()),
])
preprocessor = ColumnTransformer([
    ("num", numeric_pipeline, numeric_feats),
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_feats),
])

# 5) Full pipeline: preprocessing + linear model
pipeline = Pipeline([
    ("prep", preprocessor),
    ("lr",   LinearRegression()),
])

# 6) Fit
pipeline.fit(X_train, y_train)

# 7) Predict & evaluate
y_pred = pipeline.predict(X_val)
print(f"R² on validation:  {r2_score(y_val, y_pred):.3f}")
print(f"MAE on validation: {mean_absolute_error(y_val, y_pred):.2f}")

# 8) Sample comparison
compare = pd.DataFrame({
    "actual": y_val,
    "pred":   y_pred.round(1)
}).reset_index(drop=True)
print("\nSample predictions vs. actuals:")
print(compare.head(10))

# 9) Save the pipeline for inference
joblib.dump(pipeline, "recovery_lr_pipeline.joblib")
print("\nSaved trained pipeline to recovery_lr_pipeline.joblib")