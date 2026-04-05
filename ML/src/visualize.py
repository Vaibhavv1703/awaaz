import matplotlib.pyplot as plt

def plot_comparison(rates_before, rates_after, feature):
    labels = list(rates_before.keys())
    
    before = list(rates_before.values())
    after = list(rates_after.values())

    x = range(len(labels))

    plt.figure()
    plt.bar(x, before, alpha=0.6, label='Biased')
    plt.bar(x, after, alpha=0.6, label='Fair')

    plt.xticks(x, labels)
    plt.ylabel("Approval Rate")
    plt.title(f"Fairness Comparison: {feature}")
    plt.legend()
    plt.show()