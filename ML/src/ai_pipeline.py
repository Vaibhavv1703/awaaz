import requests

def extract_loan_data(text):
    # TEMP MOCK (replace with Gemini later)
    return {
        "Gender": "Male",
        "Married": "Yes",
        "Dependents": "0",
        "Education": "Graduate",
        "Self_Employed": "No",
        "ApplicantIncome": 5000,
        "CoapplicantIncome": 2000,
        "LoanAmount": 150,
        "Loan_Amount_Term": 360,
        "Credit_History": 1,
        "Property_Area": "Rural",
        "Income_Type": "Informal",
        "Accent_Level": "High"
    }

def run_pipeline(text):
    data = extract_loan_data(text)

    response = requests.post(
        "http://127.0.0.1:5000/evaluate",
        json=data
    )

    return response.json()

if __name__ == "__main__":
    text = "I earn 5000 and need a loan in a rural area"
    result = run_pipeline(text)

    print(result)