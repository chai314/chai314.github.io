---
title: "Authentic Idiocy v2"
summary: "Zero-shot detection of AI-generated images from the geometry of a learned image manifold. In progress."
date: 2026-11-01
weight: 20
---
<!-- AIWROTE -->
<span class="tag-pill">generative models</span><span class="tag-pill">detection</span><span class="tag-pill">in progress</span>

<!-- AIWROTE -->
A second version of my AI-generated-image detector, rebuilt around a published zero-shot method.
<!-- TODO: cite the paper this builds on (authors, venue, year) and link it. -->

<!-- AIWROTE -->
The idea: real and generated images sit differently relative to the image manifold a model has learned. Perturbing an image and measuring how its representation responds gives a training-free score that separates the two.

<!-- AIWROTE -->
**What v2 adds**

<!-- AIWROTE -->
- Scores computed with several backbones: diffusion UNet and VAE, CLIP and DINOv2.
- Head-to-head comparison against the RIGID baseline, evaluated per generator by ROC AUC with bootstrap confidence intervals.
- Decision thresholds fixed on real images only (95% true-negative rate on COCO), so they never see the generators under test.
- Ablations on the score's individual terms, variance against the number of perturbations, and robustness to common image corruptions.
- A cleanly separated pipeline: GPU jobs write a score store, and all analysis and figures run on a laptop from tidy tables.

<!-- TODO: add repository link, the v1 app link, and headline numbers once the experiments are in. -->
