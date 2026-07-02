# Chapter 12 — Development Roadmap (Merged)

> **Single source of truth** for building **AMD Port Studio**  
> **Track:** 3 — Unicorn  
> **Tagline:** *Accelerating AI migration from NVIDIA to AMD—intelligently.*  
> **Event:** [AMD Developer Hackathon: ACT II](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii)

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Build window** | Jul 1 – Jul 11, 2026 (~10 days) |
| **Kickoff** | Jul 6, 9:30 PM IST |
| **Credits available** | Jul 6–7 (hackathon Fireworks + AMD Cloud) |
| **Submission deadline** | Jul 11, 9:30 PM IST |
| **Team** | Solo developer |
| **AI (dev)** | Gemini Flash (Jul 1–6) |
| **AI (prod)** | Fireworks AI (Jul 7+) |
| **Philosophy** | Vertical slices daily — always demoable |

---

## Development Philosophy

### Rule 1 — Vertical slices, not horizontal layers

Do **not** finish one module 100% before starting the next.

```
Day 1:  Clone → stub scan → frontend shows result     (thin but end-to-end)
Day 2:  + real file list
Day 3:  + CUDA findings
Day 4:  + compatibility scores
Day 5:  + AI advisor (Gemini stub)
Day 6:  + dashboard polish
Day 7:  + Fireworks swap
...
```

### Rule 2 — Daily demo test

At the end of every day, ask:

> **Can I demonstrate AMD Port Studio to someone right now?**

If **no** → stop adding disconnected pieces; wire the pipeline first.

### Rule 3 — Deterministic first, AI last

```
Repository Scanner → Parser → Rule Engine → Scoring → AI (reasoning only)
```

Never build Chat UI → Prompt → LLM and retrofit analysis around it.

### Rule 4 — AI provider abstraction from Day 1

```python
AIProvider → GeminiProvider (dev) | FireworksProvider (prod) | MockProvider (fallback demo)
```

Fireworks credits arrive Jul 7. The app must run fully before that.

### Rule 5 — One workflow, not fifteen features

```
Paste GitHub URL / ZIP → Analyze → Review Dashboard → Migration Plan → Docker Preview → Report
```

---

## Risk Mitigation

| Risk | Level | Mitigation |
|------|-------|------------|
| **Tree-sitter** setup (grammars, Windows) | **High** | Use **Python AST first** on Day 3. Add Tree-sitter for `.cu`/C++ only if time allows (Day 8+). |
| **Fireworks integration** | Medium | `AIProvider` abstraction + Gemini/Mock from Day 1. Swap provider Jul 7 only. |
| **Large repositories** | Medium | Ignore `node_modules`, `.git`, `venv`, `__pycache__`, `dist`, `datasets`, `build`. Prioritize `requirements.txt`, `Dockerfile`, `pyproject.toml`, `.py`, `.cu`. |
| **Live demo failure** | Medium | **Fallback demo data** (pre-baked analysis JSON) if GitHub/network fails during judging. |
| **Frontend blocking** | Low | Next.js + Tailwind + shadcn/ui are mature; keep UI thin early, polish late. |

---

## Time Allocation (Solo Developer)

| Component | % of effort |
|-----------|------------|
| Backend APIs | 20% |
| Repository scanner | 15% |
| Frontend | 15% |
| AST / CUDA parser | 10% |
| Rule engine | 10% |
| Compatibility engine | 10% |
| AI integration | 10% |
| Docker generator | 5% |
| Testing & bug fixing | 5% |

---

## Repository Structure

```
amd-port-studio/
├── frontend/                 # Next.js, TypeScript, Tailwind, shadcn/ui
├── backend/                  # FastAPI entrypoint, routes, orchestration
├── scanner/                  # Repo indexing, file prioritization, ignore lists
├── parsers/                  # AST, dependency extraction, CUDA detection
├── compatibility/            # ROCm compatibility engine
├── rules/
│   ├── rocm_rules.json
│   ├── docker_rules.json
│   └── dependency_rules.json
├── ai/                       # AIProvider, Gemini, Fireworks, prompts
├── generators/               # Docker, deployment guide
├── reports/                  # HTML/PDF report templates
├── prompts/                  # Standardized prompt templates
├── demo_repositories/        # Notes + fallback analysis fixtures
├── docker/                   # Dockerfiles, compose
├── docs/                     # Architecture, chapters, this roadmap
└── tests/                    # Parser, rules, scoring unit tests
```

---

## Priority Matrix

| Priority | Features |
|----------|----------|
| **P0 — Must Have** | GitHub/ZIP import, repository scanner, dependency analyzer, CUDA detector (AST), ROCm compatibility engine, compatibility & migration scoring, AI Migration Advisor (Gemini stub → Fireworks Jul 7), interactive dashboard |
| **P1 — Should Have** | ROCm Docker generator, AMD deployment guide, HTML report export, downloadable analysis, public README with GIF/screenshots |
| **P2 — Nice to Have** | Dependency graph visualization (React Flow), PDF export, small RAG knowledge base, confidence indicators on all findings |
| **P3 — Future Roadmap** | Auto code migration, live AMD GPU benchmarking, continuous repo monitoring, enterprise collaboration |

**Under deadline pressure:** Ship P0 completely before touching P2.

---

## Calendar Overview

```
Jul 1  ████ Vertical slice v0.1 — clone + stub + frontend
Jul 2  ████ Scanner + file list in UI
Jul 3  ████ Dependencies + CUDA detection (Python AST)
Jul 4  ████ Rule engine + scoring
Jul 5  ████ AI advisor (Gemini) + report v1
Jul 6  ████ Dashboard polish + kickoff @ 9:30 PM IST
Jul 7  ████ Fireworks swap + AMD Cloud guide (CREDITS)
Jul 8  ████ Edge cases + reliability + fallback demo data
Jul 9  ████ UI polish + viz + README + architecture diagram
Jul 10 ████ Video + slides + cover image + dry-run submit
Jul 11 ████ FINAL SUBMIT by 9:30 PM IST (target 6–7 PM buffer)
```

---

# Part 1 — Pre-Hackathon (Jul 1–6)

> Build 80% without hackathon credits. Gemini + Mock AI only.

---

### Day 1 — Wednesday, Jul 1

**Theme:** Vertical slice v0.1 — *something works end-to-end*

| Build | Detail |
|-------|--------|
| Monorepo scaffold | `frontend/`, `backend/`, `docker-compose.yml` |
| FastAPI | Health check, CORS, `/api/analyze` stub |
| GitHub clone | GitPython — paste URL → clone to workspace volume |
| ZIP upload | Extract + validate |
| Frontend | Landing + import form + **results page (stub data OK)** |
| AIProvider | `MockProvider` returning fixed JSON schema |
| Docker Compose | Frontend + backend + volumes — `docker compose up` works |

**Daily demo test:** Paste GitHub URL → see repo name, file count, stub analysis on screen.

**Success metric:**
```
Repository → Clone → Frontend shows repository info ✓
```

---

### Day 2 — Thursday, Jul 2

**Theme:** Real scanner wired to UI

| Build | Detail |
|-------|--------|
| Repository indexer | Language, size, path, type per file |
| Smart ignore lists | `node_modules`, `.git`, `venv`, `__pycache__`, `dist`, datasets |
| Priority queue | Dockerfile, requirements, pyproject, `.cu`, train/main scripts first |
| SQLite schema | `analyses`, `repositories`, `files` tables |
| Frontend | File list panel with language badges + scan progress |

**Daily demo test:** Import repo → real file tree/list appears with languages detected.

**Success metric:**
```
Repository → Clone → Scanner → File list in UI ✓
```

---

### Day 3 — Friday, Jul 3

**Theme:** Dependencies + CUDA (Python AST only — no Tree-sitter yet)

| Build | Detail |
|-------|--------|
| Dependency analyzer | `requirements.txt`, `pyproject.toml`, `environment.yml`, Dockerfile |
| Python AST | Imports, `torch.cuda`, device assignments, GPU conditionals |
| CUDA detector | `torch.cuda`, TensorRT imports, `.cu` file presence, `nvcc` in build scripts |
| Docker analyzer | `nvidia/cuda`, `nvidia-container-runtime` detection |
| Frontend | CUDA findings panel — file path + line number + description |

**Daily demo test:** Import CUDA PyTorch repo → CUDA findings appear with locations.

**Success metric:**
```
Repository → Clone → Scanner → CUDA findings ✓
```

---

### Day 4 — Saturday, Jul 4

**Theme:** Rule engine + scoring — deterministic brain complete

| Build | Detail |
|-------|--------|
| `rules/rocm_rules.json` | PyTorch, TensorFlow, ONNX, TensorRT, NCCL→RCCL, CUDA runtime |
| Rule engine | IF/THEN with explainable outputs |
| Compatibility score | `(supported ÷ total) × 100` + tier (Ready / Minor / Moderate / Major) |
| Migration effort score | Weighted: CUDA APIs, TensorRT, kernels, Docker changes |
| Dependency graph (basic) | Module → import edges for Python files |
| Frontend | Compatibility gauge + per-package status table |

**Daily demo test:** Full deterministic analysis — scores + explained package statuses, no AI yet.

**Success metric:**
```
Repository → Clone → Scanner → CUDA → Compatibility score + table ✓
```

---

### Day 5 — Sunday, Jul 5

**Theme:** AI advisor + report v1 + Docker generator stub

| Build | Detail |
|-------|--------|
| Prompt builder | Structured summary only — never raw repo |
| Gemini Flash | `GeminiProvider` — migration advisor → validated JSON |
| JSON schema validation | Reject/fix malformed AI responses before UI |
| Docker generator v1 | Template: `FROM rocm/pytorch` + env vars from analysis |
| Deployment guide v1 | Template: ROCm install → build → run → validate |
| Report generator | HTML report — executive summary + findings + roadmap |
| Frontend | Migration plan panel + report preview |

**Daily demo test:** Full pipeline on Gemini — import → analyze → AI plan → Docker preview → HTML report.

**Success metric:**
```
Complete analysis workflow (Gemini) end-to-end ✓
```

---

### Day 6 — Monday, Jul 6

**Theme:** Dashboard polish + kickoff

**Morning / afternoon:**

| Build | Detail |
|-------|--------|
| Analysis progress UI | Staged: scan → deps → CUDA → compat → AI → report |
| Dashboard panels | Score, risk badges, effort estimate, checklist |
| Demo repo list | 3 repos: easy / medium / hard CUDA projects |
| Fireworks stub | `FireworksProvider` class ready, env var gated |
| README v1 | Setup + quick start |

**Evening 9:30 PM IST — Attend kickoff**
- Note any revealed models or requirement changes
- Adjust `rocm_rules.json` if needed

**Daily demo test:** Polished 3-minute demo path on Gemini — ready to show anyone.

**Success metric:**
```
Demo-ready MVP (pre-Fireworks) ✓
```

---

# Part 2 — Hackathon (Jul 6 night – Jul 11)

> Credits live. Fireworks integration. Polish. Submit.

---

### Day 7 — Tuesday, Jul 7

**Theme:** Fireworks + AMD integration (**CREDITS DAY**)

| Build | Detail |
|-------|--------|
| Fireworks API key | Wire `FireworksProvider` as default |
| End-to-end Fireworks test | 2 demo repos — confirm ~30–60s total analysis |
| Token optimization | Structured prompts only; log token usage |
| AMD Developer Cloud | Deployment guide section with cloud-specific steps |
| ROCm rules review | Cross-check with kickoff materials |
| RAG v1 (optional P2) | Small KB snippets injected into Fireworks context |

**Daily demo test:** Same demo as Day 6 but AI powered by **Fireworks**.

**Success metric:**
```
Fireworks-powered analysis + AMD alignment documented ✓
```

---

### Day 8 — Wednesday, Jul 8

**Theme:** Edge cases + reliability

| Build | Detail |
|-------|--------|
| Graceful degradation | `limitations[]`, `confidence` on findings, partial analysis continues |
| Monorepo basics | Per-directory service breakdown in report |
| Missing Dockerfile | Auto-generate AMD Dockerfile |
| Missing requirements | Import-inference fallback from AST |
| False positive reduction | Comments/docs → lower confidence |
| Parallel file processing | Workers for Python / CUDA / Docker paths |
| **Fallback demo data** | `demo_repositories/fallback_analysis.json` — offline demo mode |
| Tree-sitter (optional) | `.cu` / C++ only — only if Day 3–7 went smoothly |

**Daily demo test:** Messy repo + fallback mode both work without crashing.

**Success metric:**
```
3+ real repos analyzed; fallback demo if GitHub fails ✓
```

---

### Day 9 — Thursday, Jul 9

**Theme:** UI polish + documentation

| Build | Detail |
|-------|--------|
| shadcn/ui polish | Professional engineering-tool aesthetic |
| React Flow (P2) | Dependency graph if time |
| Recharts | Compatibility gauge + effort chart |
| README | Architecture diagram, demo GIF, screenshots |
| Architecture diagram | Frontend → Backend → Scanner → Rules → AI → Report |
| 1-page judge handout | Problem → solution → workflow → AMD value (PDF slide) |

**Daily demo test:** First impression is polished — README + UI look production-grade.

**Success metric:**
```
Judge-ready visuals + docs ✓
```

---

### Day 10 — Friday, Jul 10

**Theme:** Submission assets + dry run

| Build | Detail |
|-------|--------|
| Demo video | 2–5 min screen recording with narration |
| Slide deck | Problem, architecture, live demo screenshots, roadmap |
| Cover image | 1200×630 professional banner |
| Fresh clone test | New machine: `docker compose up --build` from README |
| GitHub repo public | MIT license |
| lablab.ai dry-run | Fill all submission fields except final publish |

**3-minute demo script (memorize):**
1. Paste CUDA PyTorch repo
2. 30–60s analysis progress
3. Compatibility score + explained CUDA findings
4. AI migration plan (Fireworks)
5. Generated ROCm Dockerfile
6. Download migration report
7. *"Weeks of manual investigation → minutes"*
8. Roadmap: Advisor → auto-migration → benchmarking → enterprise

**Daily demo test:** Record video in one take without errors.

**Success metric:**
```
All submission media ready ✓
```

---

### Day 11 — Saturday, Jul 11

**Theme:** Submit — no new features

| Time | Action |
|------|--------|
| Morning | Bug fixes only |
| Afternoon | Final smoke test + lablab.ai submission |
| **Target 6–7 PM IST** | **Submit** (buffer before 9:30 PM deadline) |

**Daily demo test:** Submitted project link works when opened fresh.

**Success metric:**
```
Project submitted on lablab.ai ✓
```

---

# Part 3 — Combined Submission Checklist

## lablab.ai Platform

### Basic information
- [ ] **Project title:** AMD Port Studio
- [ ] **Short description** — one-liner value prop
- [ ] **Long description** — problem, solution, tech stack, AMD alignment, Track 3
- [ ] **Technology tags** — Next.js, FastAPI, Fireworks AI, ROCm, Docker, Python, TypeScript
- [ ] **Category tags** — Developer Tools, AI Infrastructure, GPU Migration

### Media
- [ ] **Cover image** (professional, product visible)
- [ ] **Video presentation** (2–5 min demo)
- [ ] **Slide presentation** (PDF/PPT)

### Code & hosting
- [ ] **Public GitHub repository**
- [ ] **README** — setup, usage, architecture, demo GIF/screenshots
- [ ] **Application URL** or clear Docker local demo instructions
- [ ] **Demo platform** noted (Docker Compose / deployed URL)

### Hard requirements
- [ ] **Containerized** — `docker compose up` works from README
- [ ] **Runnable** from documented instructions
- [ ] **Original work** + **MIT-compliant** dependencies
- [ ] **Track 3 (Unicorn)** positioning clear in description

---

## Technical MVP (P0)

### Core workflow
- [ ] GitHub URL import
- [ ] ZIP upload
- [ ] Repository scanner (ignore lists + prioritization)
- [ ] Dependency analyzer
- [ ] CUDA detector (Python AST — not regex-only)
- [ ] ROCm compatibility engine (rule-based JSON)
- [ ] Compatibility score + migration effort score
- [ ] AI Migration Advisor (**Fireworks** in production path)
- [ ] Interactive dashboard
- [ ] `AIProvider` abstraction (Gemini/Mock/Fireworks)

### AMD / hackathon alignment
- [ ] **Fireworks AI** integrated for inference
- [ ] **ROCm** compatibility knowledge base
- [ ] **AMD Developer Cloud** deployment guidance
- [ ] Generated Docker uses ROCm base image, not `nvidia/cuda`
- [ ] Hybrid architecture documented (deterministic + AI)

### Engineering quality
- [ ] Structured JSON from AI, validated before UI
- [ ] Confidence scores on findings
- [ ] Graceful degradation on edge cases
- [ ] Analysis ~30–60s for medium repos
- [ ] No silent failures
- [ ] **Fallback demo data** for offline/judging contingency

### P1 (should have before submit)
- [ ] ROCm Docker generator
- [ ] AMD deployment guide
- [ ] HTML report export / download
- [ ] Architecture diagram in README
- [ ] 3 demo repositories documented (easy / medium / hard)
- [ ] 1-page judge handout

### Explicitly out of scope
- [ ] ~~Kubernetes~~
- [ ] ~~CI/CD~~
- [ ] ~~Auto deployment to AMD Cloud~~
- [ ] ~~Live GPU benchmarking~~
- [ ] ~~Multi-user auth~~
- [ ] ~~Full DevOps platform~~

---

## Presentation (Judge Appeal)

- [ ] Opens with migration problem (CUDA lock-in, adoption friction)
- [ ] Positions as **developer platform**, not chatbot
- [ ] Shows hybrid architecture — what AI does vs does not do
- [ ] Live demo on real CUDA repository
- [ ] Honest edge cases — unsupported libs flagged clearly
- [ ] Ends with startup roadmap (Phases 2–4)
- [ ] Clear AMD ecosystem value — helps developers **choose AMD**

---

## Pre-Submit Smoke Test

```bash
# 1. Fresh clone
git clone <your-public-repo>
cd amd-port-studio
docker compose up --build

# 2. Browser — http://localhost:3000
# 3. Paste known CUDA PyTorch repo OR use fallback demo mode
# 4. Verify: score, CUDA findings, AI plan, Docker preview, report download
# 5. Confirm Fireworks in backend logs (not Gemini/Mock)
# 6. Test fallback demo mode (disable network / use fixture button)
```

---

## If You Fall Behind

| Cut first | Never cut |
|-----------|-----------|
| PDF export, React Flow, RAG | Import → scan → CUDA → rules → score |
| Tree-sitter | AI advisor (even Mock → Fireworks later) |
| Monorepo split | Dashboard showing results |
| Polish animations | Docker generator (minimal template OK) |
| | Fallback demo data |
| | Submission video + README |

---

## Daily Standup Questions

1. Can I demo the full workflow to someone today?
2. What is the thinnest vertical slice I can ship tonight?
3. Am I building features or integrating the pipeline?
4. Is anything blocked until Jul 7 that I can stub now?

---

## Reference — Chapters 1–11

| Chapter | Guides |
|---------|--------|
| 1–4 | Strategy, problem, Track 3 positioning |
| 5 | Features & user journey |
| 6 | System architecture (FastAPI, Next.js, Docker) |
| 7 | AI boundaries, prompts, structured JSON |
| 8 | Algorithms, scoring formulas |
| 9 | Edge cases, graceful degradation |
| 10 | Bottlenecks, performance targets, selective context |
| 11 | Full tech stack, Gemini + Fireworks split |

---

*Last updated: Jul 1, 2026 — AMD Port Studio hackathon build plan*
