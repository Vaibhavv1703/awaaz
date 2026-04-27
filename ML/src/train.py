import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv("../dataset/clean/final.csv")
raw_df = df.copy()

SENSITIVE = ['Gender', 'Property_Area', 'Income_Type', 'Accent_Level']

# Encode all categorical columns
encoders = {}
for col in df.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

X = df.drop(columns=['Loan_Status'])
y = df['Loan_Status']

print(f"Dataset: {len(df)} rows | Approval rate: {y.mean():.1%}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

def biased_weight(idx):
    row = raw_df.loc[idx]
    w = 1.0
    if raw_df.loc[idx, 'Loan_Status'] == 'N':
        if str(row.get('Property_Area', '')) == 'Rural':    w *= 4.0
        if str(row.get('Gender', ''))         == 'Female':  w *= 3.5
        if str(row.get('Income_Type', ''))    == 'Informal':w *= 4.0
        if str(row.get('Accent_Level', ''))   == 'High':    w *= 2.0
    return w

biased_weights = pd.Series(
    [biased_weight(i) for i in X_train.index], index=X_train.index
)

model_biased = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
model_biased.fit(X_train, y_train, sample_weight=biased_weights)
print(f"Biased model  | acc={model_biased.score(X_test, y_test):.3f} | approval rate={model_biased.predict(X_test).mean():.1%}")

# Fair model: remove sensitive features entirely
# Can ONLY use: income, credit history, loan amount, term, dependents etc.
X_train_fair = X_train.drop(columns=SENSITIVE)
X_test_fair  = X_test.drop(columns=SENSITIVE)

model_fair = RandomForestClassifier(
    n_estimators=200, max_depth=5, min_samples_leaf=2, random_state=42
)
model_fair.fit(X_train_fair, y_train)
print(f"Fair model    | acc={model_fair.score(X_test_fair, y_test):.3f} | approval rate={model_fair.predict(X_test_fair).mean():.1%}")

bp = model_biased.predict(X_test.reindex(columns=list(model_biased.feature_names_in_), fill_value=0))
fp = model_fair.predict(X_test_fair.reindex(columns=list(model_fair.feature_names_in_), fill_value=0))
print(f"\nBias corrected (reject -> approve): {((bp==0)&(fp==1)).sum()} cases")
print(f"Over-corrected (approve -> reject): {((bp==1)&(fp==0)).sum()} cases")

joblib.dump(model_biased, "../models/biased.pkl")
joblib.dump(model_fair,   "../models/fair.pkl")
joblib.dump(encoders,     "../models/encoders.pkl")
print("\nModels trained and saved.")