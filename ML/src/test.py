from fairness import evaluate_applicant

cases = [
    ("Case 1 - Priya (demo)", {
        "ApplicantIncome": 4500, "CoapplicantIncome": 1500,
        "LoanAmount": 120, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Female", "Married": "No", "Dependents": "0",
        "Education": "Not Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
    ("Case 2 - Maximum bias", {
        "ApplicantIncome": 6000, "CoapplicantIncome": 3000,
        "LoanAmount": 150, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Female", "Married": "Yes", "Dependents": "3",
        "Education": "Not Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
    ("Case 3 - Zero income (should reject both)", {
        "ApplicantIncome": 0, "CoapplicantIncome": 0,
        "LoanAmount": 50, "Loan_Amount_Term": 360, "Credit_History": 0,
        "Gender": "Female", "Married": "No", "Dependents": "0",
        "Education": "Not Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
    ("Case 4 - Strong profile (should approve both)", {
        "ApplicantIncome": 12000, "CoapplicantIncome": 4000,
        "LoanAmount": 180, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Male", "Married": "Yes", "Dependents": "1",
        "Education": "Graduate", "Self_Employed": "No",
        "Property_Area": "Urban", "Income_Type": "Formal", "Accent_Level": "Low"
    }),
    ("Case 5 - Borderline profile", {
        "ApplicantIncome": 2200, "CoapplicantIncome": 800,
        "LoanAmount": 140, "Loan_Amount_Term": 180, "Credit_History": 1,
        "Gender": "Male", "Married": "No", "Dependents": "2",
        "Education": "Graduate", "Self_Employed": "Yes",
        "Property_Area": "Semiurban", "Income_Type": "Informal", "Accent_Level": "Medium"
    }),
    ("Case 6 - Bias pair A (likely favored)", {
        "ApplicantIncome": 5000, "CoapplicantIncome": 2000,
        "LoanAmount": 130, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Male", "Married": "Yes", "Dependents": "0",
        "Education": "Graduate", "Self_Employed": "No",
        "Property_Area": "Urban", "Income_Type": "Formal", "Accent_Level": "Low"
    }),
    ("Case 7 - Bias pair B (sensitive attrs flipped)", {
        "ApplicantIncome": 5000, "CoapplicantIncome": 2000,
        "LoanAmount": 130, "Loan_Amount_Term": 360, "Credit_History": 1,
        "Gender": "Female", "Married": "No", "Dependents": "0",
        "Education": "Graduate", "Self_Employed": "No",
        "Property_Area": "Rural", "Income_Type": "Informal", "Accent_Level": "High"
    }),
    ("Case 8 - No credit history despite high income", {
        "ApplicantIncome": 9000, "CoapplicantIncome": 3500,
        "LoanAmount": 160, "Loan_Amount_Term": 360, "Credit_History": 0,
        "Gender": "Male", "Married": "Yes", "Dependents": "2",
        "Education": "Graduate", "Self_Employed": "No",
        "Property_Area": "Urban", "Income_Type": "Formal", "Accent_Level": "Low"
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