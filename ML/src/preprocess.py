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
    df['Income'] = df['ApplicantIncome'] + df.get('CoapplicantIncome', 0)

    income_norm   = df['Income'] / df['Income'].max()
    loan_norm     = df['LoanAmount'] / df['LoanAmount'].max()
    credit        = df['Credit_History']

    score = (
        0.45 * income_norm +
        0.40 * credit -
        0.15 * loan_norm
    )

    df['Loan_Status'] = np.where(score > 0.3, 'Y', 'N')

    # Zero or near-zero income with a significant loan → always reject
    zero_income_mask = (df['Income'] < 1000) & (df['LoanAmount'] > 10)
    df.loc[zero_income_mask, 'Loan_Status'] = 'N'

    # No credit history + high loan amount → reject
    no_credit_mask = (df['Credit_History'] == 0) & (df['LoanAmount'] > df['LoanAmount'].median())
    df.loc[no_credit_mask, 'Loan_Status'] = 'N'

    print("Loan status after target creation:")
    print(df['Loan_Status'].value_counts())

    return df


def add_synthetic_bias(df):
    np.random.seed(42)

    df['Income_Type'] = np.random.choice(
        ['Salaried', 'Self_Employed', 'Informal'], len(df)
    )
    df['Accent_Level'] = np.random.choice(
        ['Low', 'Medium', 'High'], len(df)
    )

    # Rural + Informal: 80% chance of rejection (strong bias)
    mask1 = (df['Property_Area'] == 'Rural') & (df['Income_Type'] == 'Informal')
    df.loc[mask1, 'Loan_Status'] = np.where(
        np.random.rand(mask1.sum()) < 0.80, 'N', df.loc[mask1, 'Loan_Status']
    )

    # Female: 60% chance of rejection (gender bias)
    mask2 = df['Gender'] == 'Female'
    df.loc[mask2, 'Loan_Status'] = np.where(
        np.random.rand(mask2.sum()) < 0.60, 'N', df.loc[mask2, 'Loan_Status']
    )

    # High accent: 45% rejection (accent bias)
    mask3 = df['Accent_Level'] == 'High'
    df.loc[mask3, 'Loan_Status'] = np.where(
        np.random.rand(mask3.sum()) < 0.45, 'N', df.loc[mask3, 'Loan_Status']
    )

    zero_income_mask = (df['Income'] < 1000) & (df['LoanAmount'] > 10)
    df.loc[zero_income_mask, 'Loan_Status'] = 'N'

    no_credit_mask = (df['Credit_History'] == 0) & (df['LoanAmount'] > df['LoanAmount'].median())
    df.loc[no_credit_mask, 'Loan_Status'] = 'N'

    print("\nLoan status after bias injection:")
    print(df['Loan_Status'].value_counts())

    return df

if __name__ == "__main__":
    df = load_data("../dataset/raw/Loan_Prediction.csv")
    df = create_target(df)
    df = add_synthetic_bias(df)
    df.to_csv("../dataset/clean/final.csv", index=False)
    print("\nPreprocessing complete. Saved to dataset/clean/final.csv")