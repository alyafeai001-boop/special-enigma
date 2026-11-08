# ShopFYI AI

A lightweight, no-build MVP for Shopify merchants to explore product pricing, gross margins, SEO copy, and marketing ideas. It runs entirely in the browser and does not connect to Shopify or an AI provider yet.

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static web server. No install or build step is required.

## MVP features

- Calculate per-unit gross profit, gross margin, and markup from product cost, shipping, fees, and selling price.
- Compare price with a target gross margin and show an indicative target price.
- Draft an SEO title and product meta description from product details.
- Generate four editable marketing campaign starters.
- Save product analyses and basic workspace counts in browser `localStorage`.
- Copy generated text where browser clipboard permissions allow.

## Calculation notes

- Gross profit = selling price − (unit cost + shipping + estimated fees).
- Gross margin = gross profit ÷ selling price × 100.
- Markup = gross profit ÷ entered unit costs × 100.
- Suggested target price = entered unit costs ÷ (1 − target margin).

These are planning estimates, not accounting advice. The MVP does not account for taxes, payment fees unless entered, discounts, returns, inventory carrying costs, or overhead. Results and generated drafts should be reviewed before business or publishing decisions.

## Next steps

1. Connect a Shopify store with a Shopify app and use least-privilege product read scopes.
2. Add a secure backend for OAuth, Shopify API requests, and any AI provider credentials; never put API secrets in browser code.
3. Replace the starter copy templates with an AI service, with clear user consent and editable output.
4. Add tests for pricing calculations, input validation, and content generation.

## Deploy

This is a static site and can be deployed with GitHub Pages or another static host. Enable Pages for the repository's `main` branch and root directory.
