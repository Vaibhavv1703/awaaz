import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV

df = pd.read_csv("../dataset/clean/final.csv")
le = LabelEncoder()
encoders = {}

for col in df.columns:
    if df[col].dtype == 'object':
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

X = df.drop(columns=['Loan_Status'])
y = df['Loan_Status']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Sensitive features
SENSITIVE = ['Gender', 'Property_Area', 'Income_Type', 'Accent_Level']

# Biased model
model_biased = RandomForestClassifier(n_estimators=100)
model_biased.fit(X_train, y_train)

# Fair model
X_train_fair = X_train.drop(columns=SENSITIVE)
model_fair = LogisticRegression(max_iter=3000)
sample_weights = df.apply(
    lambda row: 5 if (
        row['Property_Area'] == 'Rural' or 
        row['Gender'] == 'Female' or 
        row['Income_Type'] == 'Informal'
    ) else 1,
    axis=1
)
model_fair.fit(X_train_fair, y_train, sample_weight=sample_weights.loc[X_train.index])

param_grid_rf = {
    "n_estimators": [100, 200],
    "max_depth": [5, 10, None],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2]
}

grid_rf = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid_rf,
    cv=3,
    scoring="accuracy",
    n_jobs=-1
)

grid_rf.fit(X_train, y_train)
model_biased = grid_rf.best_estimator_
print("Best RF params:", grid_rf.best_params_)

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('lr', LogisticRegression(max_iter=5000))
])

param_grid_lr = {
    "lr__C": [0.1, 1, 10],
    "lr__class_weight": [None, "balanced"]
}

grid_lr = GridSearchCV(
    pipeline,
    param_grid_lr,
    cv=3,
    scoring="accuracy"
)

grid_lr.fit(X_train_fair, y_train)

model_fair = grid_lr.best_estimator_

print("Best LR params:", grid_lr.best_params_)

joblib.dump(model_biased, "../models/biased.pkl")
joblib.dump(model_fair, "../models/fair.pkl")
joblib.dump(encoders, "../models/encoders.pkl")
joblib.dump(X_train.columns.tolist(), "../models/features.pkl")
print("Models trained and saved")