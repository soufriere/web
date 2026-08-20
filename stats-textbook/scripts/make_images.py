#!/usr/bin/env python3
"""Generates all raster (PNG) figures used in the statistics textbook."""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
from scipy import stats

OUT = "/home/user/web/stats-textbook/images"
plt.rcParams.update({
    "font.size": 13,
    "font.family": "DejaVu Sans",
    "axes.edgecolor": "#333333",
    "axes.labelcolor": "#222222",
    "text.color": "#222222",
    "xtick.color": "#333333",
    "ytick.color": "#333333",
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "savefig.facecolor": "white",
})
BLUE = "#2b6cb0"
ORANGE = "#dd6b20"
GREEN = "#2f855a"
RED = "#c53030"
GRAY = "#718096"

def save(fig, name, w=7.5, h=5):
    fig.set_size_inches(w, h)
    fig.tight_layout()
    fig.savefig(f"{OUT}/{name}.png", dpi=150)
    plt.close(fig)

# ---------- Ch1: statistics in everyday life (bar chart teaser) ----------
def ch1_teaser():
    fig, ax = plt.subplots()
    cats = ["Business", "Medicine", "Sports", "Government", "Engineering", "Social Science"]
    vals = [82, 91, 74, 88, 79, 85]
    ax.bar(cats, vals, color=BLUE)
    ax.set_ylabel("% of professionals using statistical methods\n(illustrative)")
    ax.set_title("Statistics Touches Every Field")
    plt.setp(ax.get_xticklabels(), rotation=25, ha="right")
    save(fig, "ch1_teaser")

# ---------- Ch3: mean vs median under skew ----------
def ch3_skew():
    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    titles = ["Symmetric", "Right-Skewed (Positive)", "Left-Skewed (Negative)"]
    data_sets = [
        np.random.default_rng(1).normal(50, 10, 5000),
        np.random.default_rng(2).gamma(2, 8, 5000),
        100 - np.random.default_rng(3).gamma(2, 8, 5000),
    ]
    for ax, title, data in zip(axes, titles, data_sets):
        ax.hist(data, bins=40, color=BLUE, alpha=0.75)
        mean, median = np.mean(data), np.median(data)
        ax.axvline(mean, color=RED, linestyle="--", linewidth=2, label=f"Mean")
        ax.axvline(median, color=GREEN, linestyle="-", linewidth=2, label=f"Median")
        ax.set_title(title, fontsize=11)
        ax.legend(fontsize=9)
        ax.set_yticks([])
    save(fig, "ch3_skew", w=12, h=4.2)

def ch3_dotplot():
    fig, ax = plt.subplots()
    data = [4, 5, 5, 6, 6, 6, 7, 7, 8, 9, 15]
    from collections import Counter
    c = Counter(data)
    for val, count in c.items():
        for i in range(count):
            ax.plot(val, i + 1, "o", color=BLUE, markersize=14)
    mean = np.mean(data)
    median = np.median(data)
    ax.axvline(mean, color=RED, linestyle="--", label=f"Mean = {mean:.1f}")
    ax.axvline(median, color=GREEN, linestyle="-", label=f"Median = {median:.1f}")
    ax.set_yticks([])
    ax.set_xlabel("Number of siblings reported by 11 students")
    ax.set_title("An Outlier Pulls the Mean, Not the Median")
    ax.legend()
    save(fig, "ch3_dotplot", h=4.5)

# ---------- Ch4: spread & boxplot anatomy ----------
def ch4_boxplot_anatomy():
    rng = np.random.default_rng(4)
    data = rng.normal(70, 12, 200)
    data = np.append(data, [20, 25, 118, 122])
    fig, ax = plt.subplots()
    bp = ax.boxplot(data, orientation="horizontal", widths=0.5, patch_artist=True,
                     boxprops=dict(facecolor="#bee3f8", color=BLUE, linewidth=2),
                     medianprops=dict(color=RED, linewidth=2),
                     whiskerprops=dict(color=BLUE, linewidth=1.5),
                     capprops=dict(color=BLUE, linewidth=1.5),
                     flierprops=dict(marker="o", markerfacecolor=ORANGE, markeredgecolor=ORANGE, markersize=6))
    q1, med, q3 = np.percentile(data, [25, 50, 75])
    iqr = q3 - q1
    ax.annotate("Q1", xy=(q1, 1.28), fontsize=11, color=BLUE, ha="center")
    ax.annotate("Median", xy=(med, 1.28), fontsize=11, color=RED, ha="center")
    ax.annotate("Q3", xy=(q3, 1.28), fontsize=11, color=BLUE, ha="center")
    ax.annotate("Outliers", xy=(120, 0.72), fontsize=11, color=ORANGE, ha="center")
    ax.set_yticks([])
    ax.set_xlabel("Value")
    ax.set_title(f"Anatomy of a Boxplot  (IQR = Q3 - Q1 = {iqr:.1f})")
    save(fig, "ch4_boxplot_anatomy", h=4.2)

def ch4_deviations():
    fig, ax = plt.subplots()
    data = [2, 4, 4, 4, 5, 5, 7, 9]
    mean = np.mean(data)
    x = np.arange(1, len(data) + 1)
    ax.bar(x, data, color=BLUE, alpha=0.3, width=0.5, zorder=1)
    ax.axhline(mean, color=RED, linewidth=2, label=f"Mean = {mean:.2f}")
    for xi, yi in zip(x, data):
        ax.plot([xi, xi], [mean, yi], color=GREEN, linewidth=2, zorder=3)
    ax.plot(x, data, "o", color=BLUE, markersize=9, zorder=4)
    ax.legend()
    ax.set_xlabel("Observation")
    ax.set_ylabel("Value")
    ax.set_title("Deviations from the Mean (green segments), Squared to Get Variance")
    save(fig, "ch4_deviations", h=4.5)

# ---------- Ch5: visualization gallery ----------
def ch5_histogram():
    rng = np.random.default_rng(5)
    data = rng.normal(68, 3, 400)
    fig, ax = plt.subplots()
    ax.hist(data, bins=18, color=BLUE, edgecolor="white")
    ax.set_xlabel("Height (inches)")
    ax.set_ylabel("Frequency")
    ax.set_title("Histogram: Adult Heights (n = 400)")
    save(fig, "ch5_histogram", h=4.5)

def ch5_bar_vs_pie():
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    labels = ["Bus", "Car", "Bike", "Walk", "Train"]
    vals = [32, 41, 9, 12, 6]
    colors = [BLUE, ORANGE, GREEN, RED, GRAY]
    axes[0].bar(labels, vals, color=colors)
    axes[0].set_title("Bar Chart: Easy to Compare Exactly")
    axes[0].set_ylabel("% of commuters")
    axes[1].pie(vals, labels=labels, autopct="%1.0f%%", colors=colors, startangle=90)
    axes[1].set_title("Pie Chart: Harder to Compare Slices")
    save(fig, "ch5_bar_vs_pie", w=11, h=4.5)

def ch5_scatter():
    rng = np.random.default_rng(6)
    x = rng.uniform(0, 10, 60)
    y = 2.3 * x + rng.normal(0, 2.5, 60) + 5
    fig, ax = plt.subplots()
    ax.scatter(x, y, color=BLUE, alpha=0.75, edgecolor="white", s=60)
    m, b = np.polyfit(x, y, 1)
    xs = np.linspace(0, 10, 50)
    ax.plot(xs, m * xs + b, color=RED, linewidth=2, label=f"Trend line")
    ax.set_xlabel("Hours studied per week")
    ax.set_ylabel("Exam score")
    ax.set_title("Scatterplot: Relationship Between Two Variables")
    ax.legend()
    save(fig, "ch5_scatter", h=4.8)

def ch5_boxplot_compare():
    rng = np.random.default_rng(7)
    groups = [rng.normal(70, 8, 100), rng.normal(78, 6, 100), rng.normal(65, 10, 100)]
    fig, ax = plt.subplots()
    bp = ax.boxplot(groups, patch_artist=True, tick_labels=["Method A", "Method B", "Method C"])
    for patch, color in zip(bp["boxes"], [BLUE, ORANGE, GREEN]):
        patch.set_facecolor(color)
        patch.set_alpha(0.5)
    ax.set_ylabel("Test score")
    ax.set_title("Comparing Distributions Across Groups")
    save(fig, "ch5_boxplot_compare", h=4.6)

def ch5_misleading_axis():
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    x = ["2021", "2022", "2023", "2024"]
    y = [101, 103, 104, 106]
    axes[0].bar(x, y, color=RED)
    axes[0].set_ylim(95, 110)
    axes[0].set_title("Truncated Axis: Looks Dramatic")
    axes[1].bar(x, y, color=GREEN)
    axes[1].set_ylim(0, 120)
    axes[1].set_title("Full Axis from Zero: Honest")
    save(fig, "ch5_misleading_axis", w=11, h=4.5)

# ---------- Ch6: normal distribution ----------
def ch6_normal_curve():
    fig, ax = plt.subplots()
    x = np.linspace(-4, 4, 400)
    y = stats.norm.pdf(x)
    ax.plot(x, y, color=BLUE, linewidth=2.5)
    ax.fill_between(x, y, color=BLUE, alpha=0.12)
    ax.set_title("The Standard Normal Distribution")
    ax.set_xlabel("z")
    ax.set_ylabel("Density")
    save(fig, "ch6_normal_curve", h=4.5)

def ch6_empirical_rule():
    fig, ax = plt.subplots()
    x = np.linspace(-4, 4, 400)
    y = stats.norm.pdf(x)
    ax.plot(x, y, color="#1a202c", linewidth=1.5)
    bands = [(-1, 1, "#2b6cb0", "68%"), (-2, -1, "#63b3ed", None), (1, 2, "#63b3ed", "95%"),
             (-3, -2, "#bee3f8", None), (2, 3, "#bee3f8", "99.7%")]
    colors3 = ["#2c5282", "#4299e1", "#90cdf4"]
    for i, sd in enumerate([3, 2, 1]):
        mask = (x >= -sd) & (x <= sd)
        ax.fill_between(x[mask], y[mask], color=colors3[i], alpha=0.55, zorder=i)
    for sd, label in [(1, "68.3%"), (2, "95.4%"), (3, "99.7%")]:
        ax.annotate(f"±{sd}σ: {label}", xy=(sd, stats.norm.pdf(sd)), xytext=(sd + 0.15, stats.norm.pdf(sd) + 0.05 * sd),
                    fontsize=9)
    for sd in [-3, -2, -1, 0, 1, 2, 3]:
        ax.axvline(sd, color="white", linewidth=1, zorder=5)
    ax.set_xticks([-3, -2, -1, 0, 1, 2, 3])
    ax.set_xticklabels(["−3σ", "−2σ", "−1σ", "μ", "+1σ", "+2σ", "+3σ"])
    ax.set_title("The Empirical (68-95-99.7) Rule")
    ax.set_yticks([])
    save(fig, "ch6_empirical_rule", h=4.8)

def ch6_zscore_shift():
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.3))
    x = np.linspace(40, 160, 400)
    y = stats.norm.pdf(x, 100, 15)
    axes[0].plot(x, y, color=BLUE, linewidth=2)
    axes[0].fill_between(x, y, where=(x <= 115), color=BLUE, alpha=0.25)
    axes[0].axvline(115, color=RED, linestyle="--")
    axes[0].set_title("IQ Score X = 115  (μ=100, σ=15)")
    axes[0].set_yticks([])
    z = np.linspace(-4, 4, 400)
    yz = stats.norm.pdf(z)
    axes[1].plot(z, yz, color=ORANGE, linewidth=2)
    axes[1].fill_between(z, yz, where=(z <= 1), color=ORANGE, alpha=0.25)
    axes[1].axvline(1, color=RED, linestyle="--")
    axes[1].set_title("Standardized: z = (115-100)/15 = 1.00")
    axes[1].set_yticks([])
    save(fig, "ch6_zscore_shift", w=11, h=4.3)

# ---------- Ch7: probability venn diagrams ----------
def _venn(ax, only_a, only_b, both, neither, la, lb, title):
    c1 = Circle((-0.55, 0), 1.15, alpha=0.35, color=BLUE)
    c2 = Circle((0.55, 0), 1.15, alpha=0.35, color=ORANGE)
    ax.add_patch(c1); ax.add_patch(c2)
    ax.set_xlim(-2.2, 2.2); ax.set_ylim(-1.6, 1.6)
    ax.set_aspect("equal"); ax.axis("off")
    ax.text(-1.1, 0, only_a, ha="center", va="center", fontsize=13)
    ax.text(1.1, 0, only_b, ha="center", va="center", fontsize=13)
    ax.text(0, 0, both, ha="center", va="center", fontsize=13)
    ax.text(0, -1.45, neither, ha="center", va="center", fontsize=10, color=GRAY)
    ax.text(-1.4, 1.25, la, fontsize=12, color=BLUE, fontweight="bold")
    ax.text(0.75, 1.25, lb, fontsize=12, color=ORANGE, fontweight="bold")
    ax.set_title(title, fontsize=12)

def ch7_venn_events():
    fig, axes = plt.subplots(1, 3, figsize=(12, 4.3))
    _venn(axes[0], "A only", "B only", "A ∩ B", "neither", "A", "B", "Events A and B Overlap")
    fig2circ = Circle((0.55, 0), 1.15, alpha=0.0)
    _venn(axes[1], "A", "B", "", "neither", "A", "B", "Mutually Exclusive (A ∩ B = ∅)")
    axes[1].patches[0].center = (-1.0, 0); axes[1].patches[1].center = (1.0, 0)
    _venn(axes[2], "", "", "A = B\n(subset)", "", "A", "B ⊇ A", "A is a Subset of B")
    axes[2].patches[1].width = axes[2].patches[1].height = 2.6
    axes[2].patches[0].center = (0, 0); axes[2].patches[1].center = (0, 0)
    save(fig, "ch7_venn_events", w=12, h=4.3)

def ch7_tree_diagram():
    fig, ax = plt.subplots(figsize=(9, 5.5))
    ax.axis("off")
    ax.set_xlim(0, 10); ax.set_ylim(0, 10)
    ax.plot([1, 1], [5, 5], marker="o", color="black")
    # root
    ax.plot(1, 5, "o", color="black", markersize=6)
    # first branches
    for y, label, p in [(8, "Disease (D)", "P(D)=0.01"), (2, "No Disease (D')", "P(D')=0.99")]:
        ax.plot([1, 4], [5, y], color=GRAY, linewidth=1.5)
        ax.plot(4, y, "o", color=BLUE, markersize=6)
        ax.text(2.3, (5 + y) / 2 + 0.35, p, fontsize=10)
        ax.text(4.2, y, label, fontsize=11, va="center")
        if y == 8:
            branches = [(9.5, "Test + (0.99)"), (6.7, "Test - (0.01)")]
        else:
            branches = [(3.3, "Test + (0.05)"), (0.5, "Test - (0.95)")]
        for y2, label2 in branches:
            ax.plot([4, 7], [y, y2], color=GRAY, linewidth=1.5)
            ax.plot(7, y2, "o", color=ORANGE, markersize=6)
            ax.text(7.2, y2, label2, fontsize=10, va="center")
    ax.set_title("Tree Diagram: Disease Screening Test", fontsize=13)
    save(fig, "ch7_tree_diagram", w=9, h=5.5)

if __name__ == "__main__":
    ch1_teaser()
    ch3_skew()
    ch3_dotplot()
    ch4_boxplot_anatomy()
    ch4_deviations()
    ch5_histogram()
    ch5_bar_vs_pie()
    ch5_scatter()
    ch5_boxplot_compare()
    ch5_misleading_axis()
    ch6_normal_curve()
    ch6_empirical_rule()
    ch6_zscore_shift()
    ch7_venn_events()
    ch7_tree_diagram()
    print("done")
