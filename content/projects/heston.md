---
title: "Heston Under the Microscope"
# AIWROTE
summary: "Monte Carlo pricing, Greeks and the cost of hedging with the wrong model, under Heston stochastic volatility. In progress."
date: 2026-11-01
weight: 10
---
{{< katex >}}
<span class="tag-pill">stochastic volatility</span><span class="tag-pill">Monte Carlo</span><span class="tag-pill">in progress</span>

<!-- AIWROTE -->
A reproducible numerical study of the Heston model, built on my coursework in stochastic calculus (MA372) and Monte Carlo methods (MA323). Every figure and table is regenerated from raw results by a single `make reproduce`.

<!-- AIWROTE -->
**What it covers**

<!-- AIWROTE -->
- **Discretisation bias.** Euler versus Andersen's quadratic-exponential (QE) scheme, including cases that violate the Feller condition, with bias measured against semi-analytic prices.
- **Variance reduction.** Antithetic variates, control variates and conditional Monte Carlo, compared by RMSE against computational cost for European and arithmetic Asian options.
- **Greeks.** Pathwise and likelihood-ratio estimators, reported with standard errors against exact values.
- **American options.** Longstaff–Schwartz regression, validated on the classic \\(K = 40,\ r = 6\\%\\) put and extended to Heston, where the exercise boundary becomes a function of variance, \\(S^*(v)\\).
- **Model-risk hedging.** Daily hedging P&L when the world is Heston but the trader hedges with Black–Scholes delta, Heston delta or delta–vega, and how P&L dispersion scales with rebalancing frequency.
- **Calibration.** Fitting Heston to a day of SPY option quotes, with bid–ask aware errors.

<!-- TODO: add repository link and a results-page link once public, e.g.
Code: [github.com/chai314/heston](https://github.com/chai314/heston) · [Lab book](...) -->
