# Lumpy - MVP

A single, deployable web app that unifies Lumpy's marketing site with its six
financial tools into one continuous product for people with irregular income.

## What's here

```
lumpy/
├── index.html          Landing page (hero + the six-module system)
├── about.html          About / story / founders (founder bios are placeholders)
├── modules.html        The hub - live profile card, progress, ordered roadmap
├── tool.html           Framed module page (?m=1..6) that embeds each tool
├── assets/
│   ├── lumpy.css        Brand design system + shell components
│   └── lumpy.js         Store, module metadata, hub + tool-page logic
├── tools/
│   ├── m1-income-smoothing.html
│   ├── m2-smart-spending.html
│   ├── m3-stability.html
│   ├── m4-credit.html
│   ├── m5-tax.html
│   └── m6-annual-planner.html   Module 6 - the capstone (consolidates 1-5)
├── vercel.json
└── build_tools.py      Re-wraps the source tool fragments (see below)
```

## How it works

- The **six tools** are the original, tested fragments - their financial logic
  is untouched. Each was wrapped into a standalone page and given a small
  *bridge* script that: prefills shared values from earlier modules, saves
  progress, repurposes the in-tool "next module" button, and reports its height
  so the embed has no inner scrollbar.
- **Data flows between modules** through `localStorage`. Because the shell and the
  tools are served from the same origin, they share storage automatically:
  - Module 1 → smoothed income, tax rate, currency, essentials, **annual income total**
  - those feed Modules 2, 3, 4 (smoothed income/essentials) and **Module 5 (annual total → tax gross)**
  - Module 3 → Shield balance + RA value → feed Module 4
- **Module 6 (Annual Planner)** is the capstone. It auto-loads **nine foundation
  values** harvested from the earlier modules and shows them pre-filled (green) in
  its Step 1, with a "Reload from modules" button:
  - Module 1 → smoothed income, Shield monthly top-up
  - Module 2 → Tier 1 / 2 / 3 monthly totals
  - Module 3 → RA + TFSA monthly contributions
  - Module 5 → effective tax rate, annual RA deduction
  - The user then adds opening balances (Step 2) and a 12-month forecast (Step 3)
    to get opening→closing balance projections for every account.

### Two storage keys (why there are two)

- `lumpy_profile_v1` - the shell's own profile (drives the hub card + the
  cross-module prefills for Modules 2-5). Unchanged from the first MVP.
- `lumpy_profile` - the **nine-field foundation object Module 6 reads**. The bridge
  writes this from Modules 1/2/3/5 as they're used. Kept as a separate key so the
  original hub/carry behaviour is untouched; both feature sets work side by side.

### window.storage shim

Module 6 was authored against the `window.storage` API (an async key/value store).
That API doesn't exist on a plain web host, so each wrapped tool now includes a
small shim that backs `window.storage` with `localStorage`. It's a no-op if a real
`window.storage` is ever present, so nothing breaks either way.
- **Progress is saved**, including freely-added expense/deduction rows and Module
  6's 12-month income forecast (whose cells have no ids), all restored on reload.
- The **hub** (`modules.html`) shows that shared profile live, plus a progress
  ring and the recommended order.
- **No backend.** All data stays in the visitor's browser.

## Run locally

```bash
cd lumpy
python3 -m http.server 8000
# open http://localhost:8000
```

(A static server is required - opening files directly with `file://` blocks the
iframes and storage.)

## Deploy to Vercel

```bash
npm i -g vercel      # if needed
cd lumpy
vercel               # or: drag the folder into vercel.com/new
```

No build step. It's a static site; `vercel.json` enables clean URLs.

## Integrating into an existing site

The build is two layers and they can be adopted independently:

- **Tools layer** (`tools/` + `assets/lumpy.js` + the iframe pattern in `tool.html`)
  - the portable, valuable part. Drop it into any existing site and the
  cross-module data flow and progress saving keep working.
- **Shell layer** (`index.html`, `about.html`, the styling) - optional if the
  team already has a landing/about page they want to keep.

Easiest adoption paths, least to most effort:

1. **Run the whole app on a sub-path** (e.g. `yoursite.com/app`) and link to it
   from the existing site. Near-zero effort; both coexist.
2. **Keep the hub + tools, swap in the existing landing/about** - replace
   `index.html` / `about.html`, keep `modules.html`, `tool.html`, `tools/`.
3. **Fully merge** the tools into existing pages using the same iframe-embed
   pattern.

### One integration rule (important)

Data flow works because the shell and the tools are served from the **same
origin** (same scheme + domain + port). Keep everything on one site/sub-path. If
the tools are ever moved to a *different subdomain* from the pages that read
their data, the "your numbers carry across modules" feature will stop working,
because browsers isolate storage per origin.

## Before you ship

- **Founder bios** in `about.html` are marked `[Add … bio here]` - paste the real
  copy from the live About page.
- Charts and fonts load from CDNs (Chart.js, Google Fonts) and need internet.
- The logo lives at `assets/lumpy-logo.png` (transparent background so it sits on
  light and dark sections). Drop in a replacement of similar proportions to swap it.
- To re-generate the tool wrappers after editing a source fragment, drop the new
  fragment in `tools/` and run `python3 build_tools.py`.

## Known fast-follows (not in this MVP)

- Accounts / login if you ever want data to follow a user across devices.
- Per-module reset (currently the hub offers a single "clear all my data").
