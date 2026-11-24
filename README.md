# lean-six-sigma.demo.orchestrate.ca

A fictional Lean Six Sigma coaching, training and projects firm, built live by the Orchestrate Solutions agent team in an
Orchestrate demonstration. Static site: HTML, CSS and JavaScript. English. The firm, its people and prices are fictional.

**Demo shop: test payments only. No real money moves.** (Services site: `"brand": {"kind": "services"}` in
`shop/catalog.json`, no stores.) Preview: `http://127.0.0.1:8796/s/lean-six-sigma/`. Sandbox card 4242 4242 4242 4242 pays.

## Pages and owners
| File | Owner |
|---|---|
| `index.html`, `js/app.js` | Full-Stack |
| `pages/services.html` (anchors `#training #coaching #projects #guides`, card id = item id), `shop/catalog.json`, `js/shop/services.js` | senior1 |
| cart drawer `js/shop/cart.js` | senior2 |
| `pages/checkout.html` | senior3 |
| `pages/order.html`, `pages/account.html` | senior4 |
| guides and tools (see Sprint) | senior5 to senior8 |
| `css/tokens.css` | Designer |
| `css/layout.css`, `js/nav.js`, `js/motion.js` | UI/UX |
| `README.md`, `css/site.css`, `js/shop/core.js`, `css/shop/core.css` | Lead Developer |

## Shared contract
- `window.Shop` (`js/shop/core.js`): `api`, `catalog`, `cart/saveCart/addToCart/cartCount`, `money`, `toast`,
  `orders/addOrder`, `customerId`, `get/set` (keys prefixed `shop:lean-six-sigma:`), `url`, `esc`, `download`,
  `TEST_LABEL`, `owns/owned`. Prices come only from `shop/catalog.json`; the shop service prices quotes and orders in EUR.
- A guide (catalog item with a `guide` field) is a single download: quantity stays 1.
- Guide gate (a demo in the browser, not real protection): `<body data-guide="<item id>">`; `data-teaser` elements show
  until the guide is bought, `data-locked` elements once it is.
- Calendar bookings (`js/tools.js`, key `shop:lean-six-sigma:bookings`): entries stay in this browser; the confirmation
  says so and offers an `.ics` download.
- Sample data is labelled sample; nothing is really sent. No invented phone, email or address.
- Content is general information, not professional advice. Lean Six Sigma facts (belts, DMAIC, sigma table) are
  textbook basics; anything specific (certification bodies, standards) is worded as general and not named without a source.
- Motion: attributes read by `js/motion.js`. Never reveal JS-added content with `data-reveal`; a failed catalog load shows
  a retry button.
