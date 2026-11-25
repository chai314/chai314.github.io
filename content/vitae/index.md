---
title: "vitae"
description: "The long-form CV of me: education, research, work, projects, achievements, the full course record, teaching, writing and everything else."
layout: "cv"
aliases: ["/cv/"]
showDate: false
---
## Education

{{< cv title="B.Tech in Mathematics and Computing" org="Indian Institute of Technology Guwahati" when="2022 – 2026" kind="math" >}}
Final CPI **9.26 / 10**, with 313 credits earned over eight semesters.

- **Department Rank 1** after the first year, with a CPI of 9.56. That rank came with an offer to change branch to Computer Science and Engineering, which I declined.
- **Institute Merit Scholarship**, 2023, for academic performance.
- Nominated by the Head of the Department of Mathematics for the **Dr Shankar Dayal Sharma Gold Medal**, 2026, the institute's award for all-round excellence in academics and co-curriculars.
- Two-semester B.Tech project on knot theory and lattice knots, graded **AA** in both halves. See [Research](#research).
- Five further mathematics courses audited on top of the degree requirements: operator theory, differential geometry, modern algebra, linear algebra and topology. See [Coursework](#coursework).
{{< /cv >}}

<!-- AIWROTE -->
{{< mn tilt="-2" >}}Offered Computer Science. Stayed with the maths.{{< /mn >}}

<!-- AIWROTE -->
{{< cv title="Senior Secondary (Class XII), CBSE" when="2022" kind="math" >}}
**96.6%**.
{{< /cv >}}
<!-- TODO: add the school name here once you have confirmed how you want it written. -->

<!-- AIWROTE -->
{{< cv title="Secondary (Class X), CBSE" when="2020" kind="math" >}}
**95.2%**.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Entrance examinations" when="2022" kind="math" >}}
- **JEE Main:** All India Rank **86** among more than 1.1 million candidates, with a 100 percentile score in Physics.
- **JEE Advanced:** All India Rank **1057** among roughly a quarter of a million candidates.
- **BITSAT:** 384 / 390, enough for Computer Science at BITS Pilani.
{{< /cv >}}

## Research

<!-- AIWROTE -->
{{< cv title="Knot theory and lattice knots" org="B.Tech project (MA 498 and MA 499), Department of Mathematics, IIT Guwahati" when="2025 – 26" kind="math" link="/research/" >}}
Supervised by **Prof. K. V. Srikanth**, with Srinjoy Som. Sixteen credits across two semesters, graded **AA** in both.

The first half was a survey of the combinatorial group theory behind knot invariants: group presentations, Tietze transformations, and computing fundamental groups with the Seifert–van Kampen theorem. The second half is computational, and is continuing past the degree.

Code: [Latticeknots](https://github.com/srinjoysom11/Latticeknots)
{{< /cv >}}

{{< stickers "sage latex github" >}}

<!-- AIWROTE -->
{{< cv title="Visiting Students' Research Programme" org="School of Mathematics, Tata Institute of Fundamental Research" when="May – Jun 2024" kind="math" >}}
One of **19 students** selected nationally for the mathematics programme, which ran from 20 May to 21 June 2024. A reading project on the **uniformisation theorem**: every simply connected Riemann surface is conformally the disc, the plane or the sphere.

The route was through potential theory. Perron's method for subharmonic functions, then Green's functions and bipolar Green's functions on a Riemann surface, and from those the three-way classification. I presented the proof at the end of the programme. [More on the research page.](/research/#the-uniformisation-theorem)
{{< /cv >}}

<!-- AIWROTE -->
{{< mn tilt="1.5" >}}Klein is said to have thought of the theorem at 2:30 am, mid asthma attack.{{< /mn >}}

<!-- AIWROTE -->
{{< cv title="TIME 2023" org="11th National Conference on Technology and Innovations in Math Education, IIT Jodhpur" when="Dec 2023" kind="math" >}}
Attended as a participant, 7 to 9 December 2023, and was encouraged to present at the next edition.
{{< /cv >}}

## Experience

<!-- AIWROTE -->
{{< cv title="Software Engineering Intern, Data Cloud" org="Salesforce, Inc." where="Bangalore" when="May – Jul 2025" kind="code" >}}
Received a **Pre-Placement Offer** at the end of the internship.

- Built backend services in **Java** (Spring) and **Apex**, with supporting **Python**, that let users query Data Cloud through a multimodal LLM interface. The services translate a natural-language request into **SQL**.
- Designed and automated tests for the REST and Connect APIs that link Data Cloud to the other Salesforce clouds, using Postman, JUnit and Mockito.
{{< /cv >}}

{{< stickers "java spring python junit postman mysql" >}}
<!-- TODO: if you joined Salesforce full-time, add that role above this one. -->

## Projects

<!-- AIWROTE -->
{{< cv title="Heston Under the Microscope" org="Independent project, C++ and Python" when="2026, in progress" kind="math" >}}
A reproducible numerical study of the Heston stochastic-volatility model. Euler against Andersen's quadratic-exponential scheme, variance reduction, pathwise and likelihood-ratio Greeks, Longstaff–Schwartz for American options, calibration to SPY quotes, and the cost of hedging a Heston world with a Black–Scholes delta.
{{< /cv >}}

{{< stickers "cpp python" >}}

<!-- AIWROTE -->
{{< cv title="Authentic Idiocy v2" org="Independent project" when="2026, in progress" kind="code" >}}
Zero-shot detection of AI-generated images from the geometry of a model's learned image manifold. Scores from diffusion, CLIP and DINOv2 backbones, compared against the RIGID baseline with bootstrap confidence intervals, and thresholds fixed on real images only.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Authentic Idiocy, the original" org="Personal project" when="2024" kind="code" >}}
A Streamlit app that tags an image, uploaded or scraped with Selenium, as AI-generated or authentic and as safe-for-work or not. Underneath is a plain convolutional network trained on CIFAKE, with a transfer-learned Keras ResNet50 alongside.

Code: [scrap-cats](https://github.com/chai314/scrap-cats/)
{{< /cv >}}

{{< stickers "keras streamlit selenium" >}}

<!-- AIWROTE -->
{{< cv title="Hate-speech and spam classifier" org="Kriti, the inter-hostel technical competition, IIT Guwahati" when="2024" kind="code" >}}
**First prize** in the software development problem statement. A bidirectional LSTM in Keras and TensorFlow on GloVe 300-dimensional embeddings, trained for hate-speech detection and then extended to spam.

Code: [Hate-Classy](https://github.com/chai314/Hate-Classy)
{{< /cv >}}

{{< stickers "tensorflow" >}}

<!-- AIWROTE -->
{{< cv title="An AI that learns to play Snake" org="Coding Club project, IIT Guwahati" when="2024" kind="code" >}}
A clone of Snake in PyGame, played by a feed-forward network grown with NEAT (NeuroEvolution of Augmenting Topologies), which evolves the network's wiring along with its weights.

Code: [Snek-Genetic-AI](https://github.com/chai314/Snek-Genetic-AI/)
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Monte Carlo methods lab work" org="MA 323, IIT Guwahati" when="2025" kind="math" link="/mathy/monte-carlo/" >}}
Implementations from the Monte Carlo Simulation course.

Code: [marco-polo](https://github.com/chai314/marco-polo)
{{< /cv >}}

## Honours

<!-- AIWROTE -->
{{< cv title="Terminal India 2024" org="Correlation One, with Citadel Securities" when="2024" kind="code" >}}
**Second place nationally**, in a team of two with Dev S. Teams from universities across India wrote algorithms that played each other in a round-robin tournament of a tower-defence game. It came with a cash prize of USD 1,750.
{{< /cv >}}

<!-- AIWROTE -->
{{< mn tilt="-2" >}}Team name: `}; DROP TABLE PLAYERS;--`{{< /mn >}}

<!-- AIWROTE -->
{{< cv title="STEMvibe Integral Cup" when="2026" kind="math" >}}
**Rank 9** in the finals at IIT Delhi, from more than 2,000 participants across the IITs.
{{< /cv >}}

<!-- AIWROTE -->
{{< mn tilt="-1" >}}Competitive integration. It is exactly what it sounds like.{{< /mn >}}

**I click colors in my free time**

{{< swatches-click >}}

<!-- AIWROTE -->
{{< cv title="Competitive programming" when="2024" kind="code" >}}
- **Codeforces:** Expert, maximum rating 1691, as [chai.pi](https://codeforces.com/profile/chai.pi). Global rank 50 in [Round 957 (Div. 3)](https://codeforces.com/contest/1992/standings), which had over 40,500 participants.
- **CodeChef:** 4★, maximum rating 1860, as [chai314](https://www.codechef.com/users/chai314). International rank 12 in Starters 116 (Div. 3) and rank 14 in Starters 138 (Div. 3), each with over 25,000 participants.
{{< /cv >}}

{{< stickers "c cpp git" >}}

<!-- AIWROTE -->
{{< cv title="Kriti, inter-hostel technical competition" org="IIT Guwahati" when="2023 – 24" kind="code" >}}
First prize, software development problem statement, 2024. Second prize, sci-tech quiz problem statement, 2023.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="The World Scholar's Cup" when="2019" kind="words" >}}
A school-level academic tournament with around 50,000 entrants a year. Eight medals at the **Beijing Global Round**, with golds in art and music, social studies, literature and science. Five medals at the **Tournament of Champions at Yale**, with golds in art and music and in debating.
{{< /cv >}}

## Coursework

<!-- AIWROTE -->
Fifty-three courses from the transcript, one square each, in the order I took them. The stronger the colour, the better the grade.

{{< grademap >}}

<!-- AIWROTE -->
{{< mn tilt="2" >}}Yes, basketball is on the transcript. Twice.{{< /mn >}}

<!-- AIWROTE -->
IIT Guwahati grades run AS and AA (10), AB (9), BB (8), down to DD (4). AS is given for exceptional performance. An audited course is attended in full and examined, but carries no credit.

### By area

{{< tabs >}}
{{< tab label="Analysis and geometry" md=false >}}{{< courses area="analysis" >}}{{< /tab >}}
{{< tab label="Algebra and discrete" md=false >}}{{< courses area="algebra" >}}{{< /tab >}}
{{< tab label="Probability and finance" md=false >}}{{< courses area="probability" >}}{{< /tab >}}
{{< tab label="Computation" md=false >}}{{< courses area="computation" >}}{{< /tab >}}
{{< tab label="Humanities" md=false >}}{{< courses area="humanities" >}}{{< /tab >}}
{{< /tabs >}}

### By year

{{< accordion mode="collapse" separated=true >}}
{{< accordionItem title="2022 – 23, first year" md=false >}}{{< courses year="2022-23" >}}{{< /accordionItem >}}
{{< accordionItem title="2023 – 24, second year" md=false >}}{{< courses year="2023-24" >}}{{< /accordionItem >}}
{{< accordionItem title="2024 – 25, third year" md=false >}}{{< courses year="2024-25" >}}{{< /accordionItem >}}
{{< accordionItem title="2025 – 26, final year" md=false >}}{{< courses year="2025-26" >}}{{< /accordionItem >}}
{{< /accordion >}}

### What that adds up to

<!-- AIWROTE -->
A topic-level view of the mathematics, for anyone checking prerequisites.

<!-- AIWROTE -->
- **Probability and statistics.** Measure-theoretic probability, convergence in distribution, laws of large numbers, characteristic functions, martingales, Markov chains, Brownian motion and Itô calculus, Girsanov's theorem, estimation, maximum likelihood, hypothesis testing and the Neyman–Pearson lemma.
- **Analysis.** Lebesgue integration, \\(L^p\\) spaces, the Radon–Nikodym theorem, Hilbert and Banach spaces, the Riesz representation theorem, the spectral theorem for compact operators, C\*-algebras, Cauchy–Riemann equations and the residue theorem.
- **Algebra.** Groups and the Sylow theorems, rings, fields, finite field extensions and Galois theory.
- **Geometry and topology.** Point-set topology, curves and surfaces in \\(\mathbb{R}^3\\), tangent spaces, curvature, regular surfaces, Stokes' theorem and the Banach fixed-point theorem by way of iterated function systems.
- **Numerical analysis.** Floating-point arithmetic, linear systems, least squares, interpolation, quadrature, root-finding and initial value problems.
- **Optimisation and algorithms.** Linear, integer and convex programming, network flows, dynamic programming, approximation and randomised algorithms, and complexity theory.

## Teaching

<!-- AIWROTE -->
{{< cv title="Logic, Metamathematics and Theorem Proving" org="Polygon, the Mathematics Society of IIT Guwahati" when="Winter 2024" kind="math" link="https://chai314.github.io/UnpossibleCathexis/posts/two/" >}}
Designed and ran a three-week introductory course for Polygon's first Winter Projects. Formal logic and metamathematics with historical asides, reading-heavy, ending in a project in the Lean theorem prover.
{{< /cv >}}

{{< stickers "haskell" >}}

<!-- AIWROTE -->
{{< cv title="Inter-IIT Literary Cup Mentor" org="Cultural Board, IIT Guwahati" when="2025 – 26" kind="words" >}}
Coached the institute's literary contingent for the Inter-IIT Cultural Meet.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Mentor to first-year students" org="Department of Mathematics, IIT Guwahati" when="2023 – 26" kind="life" >}}
Academic mentor to incoming Mathematics and Computing students for three years.
{{< /cv >}}

## Writing and stage

<!-- AIWROTE -->
{{< cv title="English slam poetry" when="2024 – 25" kind="words" >}}
- **Inter-IIT Cultural Meet:** silver medal in 2025, bronze medal in 2024.
- **Alcheringa**, IIT Guwahati's cultural festival: first prize, 2025. The trophy says Winner, Poetry Slam.
- **Manthan**, the inter-hostel cultural competition: first prize, 2024.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Fiction, wordplay and crosswords" when="2024 – 26" kind="words" >}}
- **Inter-IIT Cultural Meet 2024:** placed in English creative writing. [The non-fictional record of that trip.](https://chai314.github.io/UnpossibleCathexis/posts/asftidolt/)
- **Lexilympics** at Aakhar, the Literary Society's annual festival: first prize, 2026.
- **Emojination**, a Literary Society writing event: first prize, 2024.
- **National Inter-College Crossword Expedition (NICE) 2024:** third in the North East zone finals, with Shrawon Dey, which qualified us for the grand finale in New Delhi. The Eastern Sentinel wrote it up.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Head Creative and Content Head" org="Literary Society, IIT Guwahati" when="2024 – 26" kind="words" >}}
Founded **SALSA**, the institute's literary anthology, in 2025, and served as its editor for the year. [The editorial is here.](https://chai314.github.io/UnpossibleCathexis/posts/nfas/)
{{< /cv >}}

<!-- AIWROTE -->
{{< mn tilt="-1.5" >}}The fiction itself is under [writing](https://chai314.github.io/UnpossibleCathexis/posts/).{{< /mn >}}

## Leadership and service

<!-- AIWROTE -->
{{< cv title="Founding member, Polygon" org="The Mathematics Society of IIT Guwahati" kind="math" >}}{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Coordinator, Acumen" org="Quiz Club, IIT Guwahati" when="2023 – 26" kind="life" >}}
Also represented the institute in quizzing at the Inter-IIT meet, 2024–25. Organised and hosted **Otaquiz S2**, an anime quiz, in 2024, and **REMSLEEP**, the farewell quiz, in 2026.
{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Coordinator, Coding Club" org="IIT Guwahati" when="2023 – 24" kind="code" >}}{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Member, MATRIX" org="Student body of the Department of Mathematics, IIT Guwahati" when="2025 – 26" kind="math" >}}{{< /cv >}}

<!-- AIWROTE -->
{{< cv title="Volunteer, National Service Scheme" when="2024 – 25" kind="life" >}}
Two semesters of community service.
{{< /cv >}}

## Odds and ends


<!-- AIWROTE -->
- Two semesters of basketball, both passed.
- Humanities electives chosen on purpose: the short story, language acquisition, the ethnography of speaking, and the psychology of health.
- The handle is **chai314** nearly everywhere: chai, then the first three digits of \\(\pi\\).
