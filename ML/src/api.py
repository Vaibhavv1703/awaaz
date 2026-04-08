from flask import Flask, request, jsonify
from fairness import evaluate_applicant

app = Flask(__name__)

@app.route("/evaluate", methods=["POST"])
def evaluate():
    data = request.json

    result = evaluate_applicant(data)

    return jsonify(result)

@app.route("/test")
def test():
    data = {
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

    return jsonify(evaluate_applicant(data))

if __name__ == "__main__":
    app.run(debug=True)