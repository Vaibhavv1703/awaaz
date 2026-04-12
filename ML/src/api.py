from fastapi import FastAPI
from fairness import evaluate_applicant
import uvicorn

app = FastAPI()

@app.post("/evaluate")
def evaluate(data: dict):
    result = evaluate_applicant(data)
    return result

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)