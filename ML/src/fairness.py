import joblib
import pandas as pd

model_biased = joblib.load("../models/biased.pkl")
model_fair = joblib.load("../models/fair.pkl")
encoders = joblib.load("../models/encoders.pkl")

SENSITIVE = ['Gender', 'Property_Area', 'Income_Type', 'Accent_Level']

def evaluate_applicant(data_dict):
    df = pd.DataFrame([data_dict])
    
    # Biased prediction
    pred_biased = model_biased.predict(df)[0]
    
    # Fair prediction
    df_fair = df.drop(columns=SENSITIVE)
    pred_fair = model_fair.predict(df_fair)[0]
    
    bias_detected = pred_biased != pred_fair
    
    return {
        "final_decision": int(pred_fair),
        "biased_decision": int(pred_biased),
        "bias_detected": bool(bias_detected),
        "fairness_score": 100 if not bias_detected else 50
    }

def encode_input(df):
    for col, le in encoders.items():
        if col in df.columns:
            df[col] = le.transform(df[col])
    return df

def get_predictions(df):
    df = encode_input(df)

    X = df.drop(columns=['Loan_Status'])

    y_pred_biased = model_biased.predict(X)

    X_fair = X.drop(columns=SENSITIVE)
    y_pred_fair = model_fair.predict(X_fair)

    df['pred_biased'] = y_pred_biased
    df['pred_fair'] = y_pred_fair

    return df

def demographic_parity(df, group_col, pred_col):
    """
    Approval rate per group
    """
    rates = df.groupby(group_col)[pred_col].mean()
    return rates

def fairness_gap(rates):
    """
    Difference between max and min group approval rates
    """
    return rates.max() - rates.min()

def generate_fairness_report(df):
    report = {}

    for feature in ['Gender', 'Property_Area', 'Income_Type', 'Accent_Level']:
        # Biased model
        rates_biased = demographic_parity(df, feature, 'pred_biased')
        gap_biased = fairness_gap(rates_biased)

        # Fair model
        rates_fair = demographic_parity(df, feature, 'pred_fair')
        gap_fair = fairness_gap(rates_fair)

        report[feature] = {
            "biased_rates": rates_biased.to_dict(),
            "fair_rates": rates_fair.to_dict(),
            "gap_before": float(gap_biased),
            "gap_after": float(gap_fair),
            "improvement": float(gap_biased - gap_fair)
        }

    return report

def overall_fairness_score(report):
    improvements = [v['improvement'] for v in report.values()]
    return sum(improvements) / len(improvements)

