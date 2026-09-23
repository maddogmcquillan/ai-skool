# Landing page snippets

Your pre-sale landing page sits in front of Circle's checkout. Two things need to be on it.

## 1. Meta pixel (standard base code)

Put the usual Meta pixel base code in the page `<head>` with the same Pixel ID used inside
Circle. Fire `ViewContent` on load and `InitiateCheckout` when someone clicks the buy button:

```html
<script>
  fbq("track", "ViewContent", { content_name: "founding-member-presale" });
  document.querySelector("#buy-button").addEventListener("click", function () {
    fbq("track", "InitiateCheckout", { content_name: "founding-member", value: 50, currency: "USD" });
  });
</script>
```

Host the landing page on your root domain (`yourdomain.com`) and Circle on a subdomain
(`learn.yourdomain.com`). The pixel's `_fbp` and `_fbc` cookies are set on the root domain, so
they carry over to the Circle checkout and Meta can stitch the click to the purchase.

## 2. Circle affiliate "promotional link" tracking script

When you enable the promotional link in Circle (Settings > Payments > Affiliates settings >
Step 2), Circle shows a tracking script. Paste that script into the landing page `<head>`.
It reads the `?affiliate_code=` parameter from an affiliate's link to your landing page and
carries it through to the Circle checkout, so the affiliate is credited even though the buyer
passed through your page first.

Also make the buy button link straight to the paywall checkout URL Circle gives you, for
example `https://learn.yourdomain.com/checkout/founding-member`.

## 3. Landing page checklist

- Buy button goes directly to the Circle checkout URL, no extra hops.
- Price shown matches the paywall price exactly.
- Parent-facing copy: who it is for, what a week looks like, how the community is moderated,
  that member-to-member DMs are off, and that an adult on the team reviews every question thread.
- Footer links to terms, privacy policy, and a "for parents" page with the consent language.
