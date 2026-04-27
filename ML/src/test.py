from fairness import evaluate_applicant

cases = [
    ("Case 1 - Priya (demo)", {
        "ApplicantIncome": 4500, "CoapplicantIncome": 1500,
        "LoanAmount": 120, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Female", "Married": "No", "Dependents": "0",
        "Education": "Not Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
    ("Case 4 - Maximum bias", {
        "ApplicantIncome": 6000, "CoapplicantIncome": 3000,
        "LoanAmount": 150, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Female", "Married": "Yes", "Dependents": "3",
        "Education": "Not Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
    ("Zero income - should reject both", {
        "ApplicantIncome": 0, "CoapplicantIncome": 0,
        "LoanAmount": 50, "Loan_Amount_Term": 360, "Credit_History": 0,
        "Gender": "Female", "Married": "No", "Dependents": "0",
        "Education": "Not Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
]

for name, case in cases:
    result = evaluate_applicant(case)
    biased = "APPROVED" if result['biased_decision'] == 1 else "REJECTED"
    fair   = "APPROVED" if result['final_decision'] == 1 else "REJECTED"
    bias   = "BIAS DETECTED" if result['bias_detected'] else "✓  No bias"
    print(f"\n{name}")
    print(f"  Biased model : {biased}")
    print(f"  Fair model   : {fair}")
    print(f"  {bias} | Fairness score: {result['fairness_score']}")