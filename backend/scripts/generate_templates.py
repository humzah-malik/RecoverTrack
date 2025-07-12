#!/usr/bin/env python3
"""
Generate CSV + XLSX daily-log templates (with friendly headers + sample rows)
and save them to frontend/public/templates/.
"""

import os
import pandas as pd
from pathlib import Path

# ---------- 1. Friendly headers ---------------------------------------------
cols = [
    "Date",
    "Trained (Y/N)",
    "Sleep Start (HH:MM)",
    "Sleep End (HH:MM)",
    "Sleep Quality (1-5)",
    "Resting HR",
    "HRV",
    "Soreness (list)",
    "Stress (1-5)",
    "Motivation (1-5)",
    "Total Sets",
    "Failure Sets",
    "Total RIR",
    "Calories",
    "Macros (JSON)",
    "Water Intake (L)",
    "Split",
    "Recovery Rating (0-100)",
]

SPLITS = [
    "Push", "Pull", "Legs",
    "Upper", "Lower",
    "Full Body",
    "Run", "Walk", "HIIT", "Cycle",
    "Chest & Biceps", "Back & Triceps", "Legs & Shoulders",
    "Chest & Back 1", "Shoulders & Arms 1", "Legs 1",
    "Chest & Back 2", "Shoulders & Arms 2", "Legs 2",
    "Chest", "Back", "Arms", "Shoulders"
]

# ---------- 2a. Instructional rows ------------------------------------------
help_row = [""] * len(cols)
help_row[cols.index("Split")] = f"VALID SPLITS → {', '.join(SPLITS)}"

guide_row = ["*** START WRITING BELOW OR OVERWRITE SAMPLE ROWS ***"] + [""] * (len(cols)-1)

# ---------- 2. Example rows --------------------------------------------------
rows = [
    # Training day
    ["2025-07-12","Y","23:30","07:10",4,55,85,"[2,1,0,0]",2,4,
     20,2,25,2700,'{"protein":170,"carbs":320,"fat":80}',2.7,"Push", 79],
    # Rest day
    ["2025-07-13","N","23:45","07:20",3,57,82,"[3,2,1,0]",3,3,
     "","","",2500,'{"protein":160,"carbs":300,"fat":75}',2.3,"Rest", 65],
    # Another training day
    ["2025-07-14","Y","00:05","08:00",5,54,88,"[1,0,0,0]",1,5,
     18,1,22,2900,'{"protein":180,"carbs":330,"fat":85}',3.0,"Pull", 83],
]

info_row = [""] * len(cols)
info_row[cols.index("Split")] = f"VALID SPLITS → {', '.join(SPLITS)}"

df = pd.DataFrame([help_row, guide_row] + rows, columns=cols)

# ---------- 3. Output paths --------------------------------------------------
frontend_root = Path(__file__).resolve().parents[2] / "frontend"
tpl_dir = frontend_root / "public" / "templates"
tpl_dir.mkdir(parents=True, exist_ok=True)

csv_path  = tpl_dir / "daily_log_template.csv"
xlsx_path = tpl_dir / "daily_log_template.xlsx"

# ---------- 4. Write files ---------------------------------------------------
df.to_csv(csv_path,  index=False)
df.to_excel(xlsx_path, index=False)

print("✅  Templates written to:")
print("   •", csv_path.relative_to(frontend_root))
print("   •", xlsx_path.relative_to(frontend_root))