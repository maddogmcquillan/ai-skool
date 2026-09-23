// Paste into Circle: Site > Code snippets > "JavaScript code snippets".
// Do NOT wrap in <script> tags there; Circle adds them for you.
//
// What it does: loads the Meta pixel on every community page, fires PageView, and
// passes the signed-in member's email as Advanced Matching (Meta hashes it in the browser).
// Purchase events are NOT fired here; they come from the paywall thank-you snippet.

(function () {
  var PIXEL_ID = "REPLACE_WITH_PIXEL_ID";

  if (!window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  }

  var user = window.circleUser || {};
  var match = {};
  if (user.email) match.em = String(user.email).trim().toLowerCase();
  if (user.firstName) match.fn = String(user.firstName).trim().toLowerCase();
  if (user.lastName) match.ln = String(user.lastName).trim().toLowerCase();
  if (user.publicUid) match.external_id = String(user.publicUid);

  window.fbq("init", PIXEL_ID, match);
  window.fbq("track", "PageView");
})();
