from fairness import get_predictions, generate_fairness_report, overall_fairness_score
from visualize import plot_comparison
import pandas as pd

df = pd.read_csv("../dataset/clean/final.csv")

df_pred = get_predictions(df)
report = generate_fairness_report(df_pred)
ratio = overall_fairness_score(report)

print("Report:")
print("Overall Fairness Score:", ratio)

print("Property Area Fairness:")
print(report['Property_Area'])

print("Income Type Fairness:")
print(report['Income_Type'])

print("Accent Level Fairness:")
print(report['Accent_Level'])

print("Gender Fairness:")
print(report['Gender'])

feature = 'Accent_Level'
plot_comparison(report[feature]['biased_rates'],report[feature]['fair_rates'],feature)

feature = 'Income_Type'
plot_comparison(report[feature]['biased_rates'],report[feature]['fair_rates'],feature)

feature = 'Property_Area'
plot_comparison(report[feature]['biased_rates'],report[feature]['fair_rates'],feature)

feature = 'Gender'
plot_comparison(report[feature]['biased_rates'],report[feature]['fair_rates'],feature)

