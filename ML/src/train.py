import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

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

# Fair model (remove sensitive features)
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

joblib.dump(model_biased, "../models/biased.pkl")
joblib.dump(model_fair, "../models/fair.pkl")
joblib.dump(encoders, "../models/encoders.pkl")
joblib.dump(X_train.columns.tolist(), "../models/features.pkl")
print("Models trained and saved")