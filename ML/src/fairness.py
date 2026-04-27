import joblib
import pandas as pd
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

model_biased = joblib.load(MODELS_DIR / "biased.pkl")
model_fair   = joblib.load(MODELS_DIR / "fair.pkl")
encoders     = joblib.load(MODELS_DIR / "encoders.pkl")

SENSITIVE = ['Gender', 'Property_Area', 'Income_Type', 'Accent_Level']

MIN_INCOME      = 1000   # monthly income in ₹ — below this = always reject
MAX_LOAN_RATIO  = 20     # loan amount cannot exceed 20x monthly income
MIN_CREDIT      = 0      # credit_history must be >= 0; if 0 AND loan > median → reject


def hard_reject_check(data_dict):
    """
    Returns (True, reason) if applicant should be hard-rejected before model runs.
    Returns (False, None) if applicant passes basic checks.
    """
    income = float(data_dict.get('ApplicantIncome', 0)) + \
             float(data_dict.get('CoapplicantIncome', 0))
    loan   = float(data_dict.get('LoanAmount', 0))
    credit = float(data_dict.get('Credit_History', 1))

    if income < MIN_INCOME:
        return True, "Insufficient income — monthly income below minimum threshold (₹1,000)"

    if income > 0 and loan > 0 and (loan * 1000) > (income * MAX_LOAN_RATIO):
        # LoanAmount is in thousands in the dataset
        return True, f"Loan amount too high relative to income (exceeds {MAX_LOAN_RATIO}x monthly income)"

    if credit == 0 and loan > 100:  # 100 = 1 lakh, rough median
        return True, "No credit history with high loan amount"

    return False, None


def evaluate_applicant(data_dict):
    rejected, reject_reason = hard_reject_check(data_dict)
    if rejected:
        return {
            "final_decision": 0,
            "biased_decision": 0,
            "bias_detected": False,
            "fairness_score": 100,
            "reject_reason": reject_reason,
            "explanation": f"Rejected: {reject_reason}. This applies equally to all applicants regardless of background."
        }

    df = pd.DataFrame([data_dict])

    df['Income'] = pd.to_numeric(df['ApplicantIncome'], errors='coerce').fillna(0) + \
                   pd.to_numeric(df['CoapplicantIncome'], errors='coerce').fillna(0)

    for col, le in encoders.items():
        if col in df.columns:
            val = str(df[col].iloc[0])
            if val in le.classes_:
                df[col] = le.transform([val])
            else:
                df[col] = le.transform([le.classes_[0]])

    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    biased_cols = list(model_biased.feature_names_in_)
    df_biased   = df.reindex(columns=biased_cols, fill_value=0)
    pred_biased = model_biased.predict(df_biased)[0]

    fair_cols = list(model_fair.feature_names_in_)
    df_fair   = df.reindex(columns=fair_cols, fill_value=0)
    pred_fair = model_fair.predict(df_fair)[0]

    bias_detected = bool(pred_biased != pred_fair)

    if not bias_detected:
        fairness_score = 100
    else:
        fairness_score = 38

    return {
        "final_decision":  int(pred_fair),
        "biased_decision": int(pred_biased),
        "bias_detected":   bias_detected,
        "fairness_score":  fairness_score,
        "reject_reason":   None,
    }

def encode_input(df):
    df = df.copy()
    for col, le in encoders.items():
        if col in df.columns:
            df[col] = df[col].apply(
                lambda v: le.transform([str(v)])[0] if str(v) in le.classes_
                else le.transform([le.classes_[0]])[0]
            )
    return df


def get_predictions(df):
    df = encode_input(df)
    X  = df.drop(columns=['Loan_Status'], errors='ignore')

    y_pred_biased = model_biased.predict(
        X.reindex(columns=list(model_biased.feature_names_in_), fill_value=0)
    )
    y_pred_fair = model_fair.predict(
        X.drop(columns=SENSITIVE, errors='ignore')
         .reindex(columns=list(model_fair.feature_names_in_), fill_value=0)
    )

    df['pred_biased'] = y_pred_biased
    df['pred_fair']   = y_pred_fair
    return df


def demographic_parity(df, group_col, pred_col):
    return df.groupby(group_col)[pred_col].mean()


def fairness_gap(rates):
    return rates.max() - rates.min()


def generate_fairness_report(df):
    report = {}
    for feature in SENSITIVE:
        rates_biased = demographic_parity(df, feature, 'pred_biased')
        rates_fair   = demographic_parity(df, feature, 'pred_fair')
        gap_biased   = fairness_gap(rates_biased)
        gap_fair     = fairness_gap(rates_fair)

        report[feature] = {
            "biased_rates": rates_biased.to_dict(),
            "fair_rates":   rates_fair.to_dict(),
            "gap_before":   float(gap_biased),
            "gap_after":    float(gap_fair),
            "improvement":  float(gap_biased - gap_fair),
        }
    return report


def overall_fairness_score(report):
    improvements = [v['improvement'] for v in report.values()]
    return round(sum(improvements) / len(improvements) * 100, 2)