# biolane-basket

A Biolane-style product picker — "fill your basket."

## Concept (as described so far)

A mom browses a grid of product boxes. She clicks the boxes for the products
she wants. Each selected product's price appears, and a running total adds up
as she fills her basket.

> **Status:** repo scaffolded only. The full concept is still being defined —
> no site code has been written yet. Nothing here is final.

## Stack

To be decided. Following the pattern of the other sites in this account:
static HTML / CSS / JS, no build step, hosted free on GitHub Pages.

## Local development

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Deploy

GitHub Pages, served from the `main` branch. Redeploy is commit + push.
