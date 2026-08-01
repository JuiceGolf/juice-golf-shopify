# Static Page Content — Ready to Paste

Shopify pages (About, Shipping, Returns) store their body content in the Shopify database, not in theme
files — the theme only provides the template/layout. So the content below hasn't been "built" yet in the
sense that it isn't live anywhere; it's drafted copy for you (or me, once store access exists) to paste into
each Page's body when you create it in **Shopify Admin → Content → Pages**, then assign the matching
template (`page.about`, `page.shipping`, `page.returns`) in the page's **Theme template** setting.

Anything in `[brackets]` is a placeholder — a fact I don't know and won't invent. Fill those in before publishing.

---

## About page (template: `page.about`)

**Suggested title:** About

```
Golf trips are easy to plan and hard to make memorable. Juice Golf Trips exists to close that gap —
starting with the gear.

We build custom, personalized team apparel for golf trips: matching jerseys, polos, hats, and accessories
with every player's name and number on them. One shared design for the group, one simple roster, and gear
that actually looks like it belongs to a team — not a print-on-demand afterthought.

It's the first piece of a bigger idea. Juice Golf Trips connects trip planning, team apparel, and the
Juice Golf app into one place, so a group can go from "we should do a golf trip" to standing on the first
tee in matching jerseys with the app already tracking the match.

Plan the trip. Build the teams. Design the gear. Play with Juice Golf.

[Add founding story, location, and team details here.]
```

---

## Shipping page (template: `page.shipping`)

**Suggested title:** Shipping

```
Custom team apparel is made to order, so shipping works a little differently than a standard online store.

How it works:
1. You design your gear and build your roster.
2. You approve a final preview and check out.
3. Your order goes through a manual design review before production.
4. Once approved, production begins and your order ships when complete.

Because every personalized order is reviewed and produced individually, timelines are longer than
off-the-shelf products. [Confirm and publish current production + shipping timelines here, e.g.
"X–Y business days for design review, Z–W business days for production, plus standard shipping."]

Non-personalized items (accessories, trip essentials) ship separately on standard timelines.

Questions about your order's status? Contact us from the Contact page.
```

---

## Returns page (template: `page.returns`)

**Suggested title:** Returns & Exchanges

```
Because personalized items are produced with each player's name, number, and size, they're treated
differently from standard products.

Personalized apparel (jerseys, and any item with a name/number): final sale, except for production
errors or defects. If something arrived wrong or damaged, contact us and we'll make it right.

Non-personalized items (accessories, non-personalized apparel): [confirm and publish your standard
return window, e.g. "returnable within X days of delivery, unworn and in original packaging."]

Sizing: [Link to a sizing guide here once available, and confirm whether size exchanges are offered
before production begins vs. after.]

To start a return or report an issue, contact us from the Contact page with your order number.
```

---

## Legal policies — handled differently

**Privacy Policy, Terms of Service, Refund Policy, and Shipping Policy** are not built as regular Pages.
They use Shopify's native policy system:

1. Go to **Shopify Admin → Settings → Policies**.
2. Use Shopify's "Create from template" option for each policy — this generates standard boilerplate legal
   text you (ideally with legal review) edit to match your actual business practices.
3. These automatically publish at `/policies/privacy-policy`, `/policies/terms-of-service`,
   `/policies/refund-policy`, and `/policies/shipping-policy`, and automatically appear in checkout and the
   footer legal links.
4. This theme includes `templates/policy.liquid`, which styles these pages to match the rest of the site —
   no further theme work is needed once you've filled in the policy text in Settings.

I did not draft this legal text myself — it needs to reflect your actual business terms, and Shopify's
own templates are the standard, safer starting point.
