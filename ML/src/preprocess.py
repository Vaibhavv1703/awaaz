import pandas as pd
import numpy as np

def load_data(path):
    df = pd.read_csv(path)
    df.drop(columns=['Loan_ID'], inplace=True)
    
    df.fillna({
        'Gender': 'Male',
        'Married': 'Yes',
        'Dependents': '0',
        'Self_Employed': 'No',
        'Credit_History': 1,
        'LoanAmount': df['LoanAmount'].median(),
        'Loan_Amount_Term': 360
    }, inplace=True)
    
    return df

def create_target(df):
    import numpy as np

    df['Income'] = df['ApplicantIncome'] + df.get('CoapplicantIncome', 0)

    # Normalize features
    income_norm = df['Income'] / df['Income'].max()
    loan_norm = df['LoanAmount'] / df['LoanAmount'].max()
    credit = df['Credit_History']

    score = (
        0.4 * income_norm +
        0.4 * credit -
        0.2 * loan_norm
    )

    df['Loan_Status'] = np.where(score > 0.3, 'Y', 'N')

    return df

def add_synthetic_bias(df):
    np.random.seed(42)
    
    # Dividing Income Types
    df['Income_Type'] = np.random.choice(['Salaried', 'Self_Employed', 'Informal'], len(df))
    
    # Adding accent difficulty as a synthetic feature
    df['Accent_Level'] = np.random.choice(['Low', 'Medium', 'High'], len(df))
    
    # Injecting bias: rural + informal more likely rejected
    # Base strong bias
    mask1 = (
    (df['Property_Area'] == 'Rural') &
    (df['Income_Type'] == 'Informal')
)

    df.loc[mask1, 'Loan_Status'] = np.where(
    np.random.rand(mask1.sum()) < 0.8,
    'N',
    df.loc[mask1, 'Loan_Status']
)

# Secondary bias (gender)
    mask2 = df['Gender'] == 'Female'

    df.loc[mask2, 'Loan_Status'] = np.where(
    np.random.rand(mask2.sum()) < 0.6,
    'N',
    df.loc[mask2, 'Loan_Status']
)

# Accent bias (slightly weaker)
    mask3 = df['Accent_Level'] == 'High'

    df.loc[mask3, 'Loan_Status'] = np.where(
    np.random.rand(mask3.sum()) < 0.45,
    'N',
    df.loc[mask3, 'Loan_Status']
)

    print("Loan status distribution after bias injection:")
    print(df['Loan_Status'].value_counts())
    
    df.to_csv("../dataset/clean/final.csv", index=False)
    return df

if __name__ == "__main__":
    df = load_data("../dataset/raw/Loan_Prediction.csv")
    df = create_target(df)
    df = add_synthetic_bias(df)
    df.to_csv("../dataset/clean/final.csv", index=False)