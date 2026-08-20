#!/usr/bin/env python3
"""Generates placeholder chapter pages for chapters 8-28 (forthcoming content)."""
import os

OUT = "/home/user/web/stats-textbook/html"

chapters = [
    (8, "ch08-conditional-probability", "Conditional Probability and Independence", "Part II · Probability",
     "Extends Chapter 7's conditional probability with Bayes' theorem, the law of total probability, and a deeper treatment of independence for more than two events.",
     "ch07-probability-foundations", "Chapter 7: Foundations of Probability",
     "ch09-random-variables", "Chapter 9: Random Variables"),
    (9, "ch09-random-variables", "Random Variables and Expectation", "Part II · Probability",
     "Introduces random variables, probability distributions, expected value, and variance of a random variable.",
     "ch08-conditional-probability", "Chapter 8: Conditional Probability",
     "ch10-discrete-distributions", "Chapter 10: Discrete Distributions"),
    (10, "ch10-discrete-distributions", "Discrete Probability Distributions", "Part II · Probability",
     "Covers the binomial, Poisson, and geometric distributions and their applications.",
     "ch09-random-variables", "Chapter 9: Random Variables",
     "ch11-continuous-distributions", "Chapter 11: Continuous Distributions"),
    (11, "ch11-continuous-distributions", "Continuous Probability Distributions", "Part II · Probability",
     "Covers the uniform, exponential, and normal distributions as continuous probability models, and the relationship between density and probability.",
     "ch10-discrete-distributions", "Chapter 10: Discrete Distributions",
     "ch12-central-limit-theorem", "Chapter 12: The Central Limit Theorem"),
    (12, "ch12-central-limit-theorem", "The Central Limit Theorem", "Part II · Probability",
     "Develops the sampling distribution of the sample mean and the Central Limit Theorem, the bridge between probability and inference.",
     "ch11-continuous-distributions", "Chapter 11: Continuous Distributions",
     "ch13-sampling-distributions", "Chapter 13: Sampling Distributions"),
    (13, "ch13-sampling-distributions", "Sampling Distributions", "Part III · Statistical Inference",
     "Formalizes the sampling distribution concept for means and proportions and introduces standard error.",
     "ch12-central-limit-theorem", "Chapter 12: The Central Limit Theorem",
     "ch14-confidence-intervals", "Chapter 14: Confidence Intervals"),
    (14, "ch14-confidence-intervals", "Estimation and Confidence Intervals", "Part III · Statistical Inference",
     "Introduces point estimation, margin of error, and confidence intervals for means and proportions.",
     "ch13-sampling-distributions", "Chapter 13: Sampling Distributions",
     "ch15-hypothesis-testing", "Chapter 15: Hypothesis Testing"),
    (15, "ch15-hypothesis-testing", "Hypothesis Testing Fundamentals", "Part III · Statistical Inference",
     "Covers null and alternative hypotheses, p-values, significance levels, and Type I/II errors.",
     "ch14-confidence-intervals", "Chapter 14: Confidence Intervals",
     "ch16-one-two-sample-tests", "Chapter 16: One- and Two-Sample Tests"),
    (16, "ch16-one-two-sample-tests", "One- and Two-Sample Tests for Means", "Part III · Statistical Inference",
     "Covers the one-sample t-test, paired t-test, and two-sample t-test for comparing means.",
     "ch15-hypothesis-testing", "Chapter 15: Hypothesis Testing",
     "ch17-inference-for-proportions", "Chapter 17: Inference for Proportions"),
    (17, "ch17-inference-for-proportions", "Inference for Proportions", "Part III · Statistical Inference",
     "Covers confidence intervals and hypothesis tests for one and two population proportions.",
     "ch16-one-two-sample-tests", "Chapter 16: One- and Two-Sample Tests",
     "ch18-power-and-sample-size", "Chapter 18: Power and Sample Size"),
    (18, "ch18-power-and-sample-size", "Power, Effect Size, and Sample Size Planning", "Part III · Statistical Inference",
     "Covers statistical power, effect size, and how to plan a study's sample size in advance.",
     "ch17-inference-for-proportions", "Chapter 17: Inference for Proportions",
     "ch19-anova", "Chapter 19: ANOVA"),
    (19, "ch19-anova", "Analysis of Variance (ANOVA)", "Part IV · Comparing Multiple Groups",
     "Extends two-sample comparisons to three or more groups using one-way ANOVA and post-hoc tests.",
     "ch18-power-and-sample-size", "Chapter 18: Power and Sample Size",
     "ch20-chi-square-tests", "Chapter 20: Chi-Square Tests"),
    (20, "ch20-chi-square-tests", "Chi-Square Tests", "Part IV · Comparing Multiple Groups",
     "Covers the chi-square goodness-of-fit test and the chi-square test of independence for categorical data.",
     "ch19-anova", "Chapter 19: ANOVA",
     "ch21-nonparametric-methods", "Chapter 21: Nonparametric Methods"),
    (21, "ch21-nonparametric-methods", "Nonparametric Methods", "Part IV · Comparing Multiple Groups",
     "Covers rank-based alternatives to the t-test and ANOVA (Wilcoxon, Mann-Whitney, Kruskal-Wallis) for when normality assumptions fail.",
     "ch20-chi-square-tests", "Chapter 20: Chi-Square Tests",
     "ch22-correlation", "Chapter 22: Correlation"),
    (22, "ch22-correlation", "Correlation", "Part V · Relationships Between Variables",
     "Formalizes the strength and direction of a linear relationship with the correlation coefficient r, and its interpretation and pitfalls.",
     "ch21-nonparametric-methods", "Chapter 21: Nonparametric Methods",
     "ch23-simple-linear-regression", "Chapter 23: Simple Linear Regression"),
    (23, "ch23-simple-linear-regression", "Simple Linear Regression", "Part V · Relationships Between Variables",
     "Introduces the least-squares regression line, prediction, and R-squared for a single predictor.",
     "ch22-correlation", "Chapter 22: Correlation",
     "ch24-multiple-regression", "Chapter 24: Multiple Regression"),
    (24, "ch24-multiple-regression", "Multiple Regression", "Part V · Relationships Between Variables",
     "Extends regression to multiple predictors, including interpretation of coefficients and multicollinearity.",
     "ch23-simple-linear-regression", "Chapter 23: Simple Linear Regression",
     "ch25-regression-diagnostics", "Chapter 25: Regression Diagnostics"),
    (25, "ch25-regression-diagnostics", "Regression Diagnostics and Model Building", "Part V · Relationships Between Variables",
     "Covers residual analysis, checking regression assumptions, and strategies for building and comparing models.",
     "ch24-multiple-regression", "Chapter 24: Multiple Regression",
     "ch26-time-series", "Chapter 26: Time Series"),
    (26, "ch26-time-series", "Introduction to Time Series", "Part VI · Extensions",
     "Introduces trend, seasonality, and basic forecasting methods for data collected over time.",
     "ch25-regression-diagnostics", "Chapter 25: Regression Diagnostics",
     "ch27-bayesian-statistics", "Chapter 27: Bayesian Statistics"),
    (27, "ch27-bayesian-statistics", "Introduction to Bayesian Statistics", "Part VI · Extensions",
     "Contrasts the Bayesian and frequentist approaches to inference, introducing priors, likelihoods, and posteriors.",
     "ch26-time-series", "Chapter 26: Time Series",
     "ch28-ethics-and-communication", "Chapter 28: Ethics & Communication"),
    (28, "ch28-ethics-and-communication", "Statistical Ethics, Reproducibility, and Communication", "Part VI · Extensions",
     "Covers responsible data practices, reproducibility, avoiding p-hacking, and communicating statistical results honestly.",
     "ch27-bayesian-statistics", "Chapter 27: Bayesian Statistics",
     "index", "Table of Contents"),
]

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chapter {num}: {title} — Statistics: A First Course</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>

<div class="kicker">{part} &middot; Chapter {num}</div>
<h1>{title}</h1>

<div class="box caution">
  <span class="label">Forthcoming Chapter</span>
  This chapter is not yet written. It is part of the planned table of contents for <em>Statistics: A First Course</em> and will cover the material summarized below in a future edition.
</div>

<h2>Planned Coverage</h2>
<p>{blurb}</p>

<p><a href="index.html">&larr; Return to the Table of Contents</a> to see which chapters are currently available.</p>

<nav class="chapternav">
  <a href="{prev_href}.html">&larr; {prev_label}</a>
  <span class="center">Chapter {num} of 28</span>
  <a href="{next_href}.html">{next_label} &rarr;</a>
</nav>

<footer class="pagefoot">Statistics: A First Course &middot; Draft edition</footer>

</body>
</html>
"""

for num, slug, title, part, blurb, prev_href, prev_label, next_href, next_label in chapters:
    html = TEMPLATE.format(num=num, title=title, part=part, blurb=blurb,
                            prev_href=prev_href, prev_label=prev_label,
                            next_href=next_href, next_label=next_label)
    with open(os.path.join(OUT, f"{slug}.html"), "w") as f:
        f.write(html)

print(f"wrote {len(chapters)} stub pages")
