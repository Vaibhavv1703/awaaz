from fastapi import FastAPI
from fairness import evaluate_applicant

app = FastAPI()

@app.post("/evaluate")
def evaluate(data: dict):
    result = evaluate_applicant(data)
    return result