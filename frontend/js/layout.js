// Injects navbar + footer on every page. Load AFTER the Tailwind CDN, jQuery, auth.js and ui.js.
// Pages should wrap their content in <main id="main-content">. Auto-runs on DOM ready.
// Public API: Layout.setUnread(n) updates the bell badge.
// Theme: navy / teal / gold on ivory + mint; shared .btn-* helpers live in css/app.css.
// Add data-bare to <body> (login/signup) to get the Tailwind theme without navbar/footer.
// Shared design tokens (also mirrored as CSS variables in css/app.css).
// "brand" is kept as an alias of teal so older classes (bg-brand-600, text-brand-700 ...) pick up the new palette.
// AA note: #1BA3A3 / #E8A33D are decorative or used on navy; teal-700 / gold-700 are the text-safe shades on light backgrounds.
if (window.tailwind) {
  tailwind.config = { theme: { extend: {
    fontFamily: { sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"] },
    colors: {
      navy: { DEFAULT: "#0F3D56", 900: "#0A2C40", 800: "#0F3D56" },
      teal: { DEFAULT: "#1BA3A3", 600: "#148585", 700: "#0F7C7C", 800: "#0B6464" },
      gold: { DEFAULT: "#E8A33D", 700: "#8F5A06" },
      ivory: "#FAF8F2", mint: "#F1F7F6",
      brand: { 50: "#F1F7F6", 100: "#DCEFEF", 600: "#0F7C7C", 700: "#0B6464" }
    }
  } } };
}

const Layout = (() => {
  const E = UI.escapeHtml;
  const F = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2";

  // Skip-link only; buttons, cards and the rest of the look live in css/app.css.
  const css = ".skip-link{position:absolute;left:-999px}.skip-link:focus{left:8px;top:8px;z-index:200}";

  // Detail/form pages highlight their parent section in the nav.
  const PARENT = { "event.html": "events.html", "event-form.html": "events.html", "announcement.html": "announcements.html",
    "announcement-form.html": "announcements.html", "promo.html": "promos.html", "promo-form.html": "promos.html" };
  const current = () => { const p = location.pathname.split("/").pop() || "index.html"; return PARENT[p] || p; };

  function navLinks(here, mobile) {
    const items = [["dashboard.html", "Home"], ["events.html", "Events"], ["announcements.html", "Announcements"], ["promos.html", "Promos"], ["my-registrations.html", Auth.isAdmin() ? "Registrations" : "My registrations"]];
    // ROLE GUARD: UI only: Dashboard/Admin links are rendered for admins only; server enforces too.
    if (Auth.isAdmin()) items.push(["admin-dashboard.html", "Dashboard"], ["admin.html", "Admin"]);
    // Desktop: one line, active link = teal text + 2px teal underline sitting on the row's bottom border. Mobile: stacked rows.
    const base = mobile
      ? "block whitespace-nowrap rounded px-3 py-2.5 text-sm font-medium text-navy hover:bg-mint "
      : "inline-block whitespace-nowrap py-3 text-sm font-medium text-navy hover:text-teal-700 border-b-2 border-transparent -mb-px ";
    const active = mobile ? "bg-mint text-teal-700 font-semibold" : "text-teal-700 !border-teal";
    return items.map(([href, label]) =>
      '<a href="' + href + '" class="' + base + F + (here === href ? " " + active : "") + '"' + (here === href ? ' aria-current="page"' : "") + ">" + label + "</a>").join("");
  }

  const LOGO = '<img src="assets/favicon.png" alt="" class="h-9 w-auto shrink-0"><span class="flex flex-col leading-tight whitespace-nowrap">' +
    '<span class="font-semibold text-navy text-lg">Civic Event</span>' +
    '<span class="text-[10px] text-slate-500 hidden sm:block">Community &bull; Engagement &bull; Unity</span></span>';
  const SEARCH_ICON = '<svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"/></svg>';
  const BELL = '<a href="notifications.html" class="relative shrink-0 rounded-full p-2 text-navy hover:bg-mint ' + F + '" aria-label="Notifications (0 unread)" data-bell>' +
    '<svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>' +
    '<span data-unread class="hidden absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-700 text-white text-[10px] leading-[1.1rem] text-center" aria-hidden="true">0</span></a>';

  function header() {
    const user = Auth.getUser();
    if (!user) {
      return '<header id="site-header" class="bg-white border-b border-gray-200"><div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">' +
        '<a href="index.html" class="flex items-center gap-2 rounded ' + F + '">' + LOGO + '</a>' +
        '<a href="login.html" class="btn-secondary whitespace-nowrap">Log in</a></div></header>';
    }
    return '<header id="site-header" class="bg-white sticky top-0 z-50">' +
      // Row 1: brand | search, bell, profile (lg+) / bell, hamburger (<lg)
      '<div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">' +
        '<a href="dashboard.html" class="flex items-center gap-2 mr-auto rounded ' + F + '">' + LOGO + '</a>' +
        '<form role="search" action="events.html" method="get" class="hidden lg:block relative w-64">' +
          '<label for="global-search" class="sr-only">Search</label>' +
          '<span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-500">' + SEARCH_ICON + '</span>' +
          '<input id="global-search" name="q" type="search" placeholder="Search events..." class="w-full rounded border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm ' + F + '"></form>' +
        BELL +
        '<div class="relative hidden lg:block"><button id="profile-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="profile-menu" class="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-mint ' + F + '">' +
          '<span aria-hidden="true" class="h-8 w-8 rounded-full bg-navy text-white grid place-items-center text-sm font-semibold">' + E((user.full_name || "?").charAt(0).toUpperCase()) + "</span>" +
          '<span class="text-sm font-medium text-navy max-w-[8rem] truncate whitespace-nowrap">' + E(user.full_name) + "</span></button>" +
          '<div id="profile-menu" role="menu" aria-labelledby="profile-btn" hidden class="absolute right-0 mt-2 w-48 rounded-md bg-white border border-gray-200 shadow-md py-1">' +
            '<a role="menuitem" href="dashboard.html" class="block px-4 py-2 text-sm hover:bg-mint ' + F + '">Home</a>' +
            '<a role="menuitem" href="profile.html" class="block px-4 py-2 text-sm hover:bg-mint ' + F + '">Profile</a>' +
            '<button role="menuitem" type="button" id="logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-mint ' + F + '">Log out</button></div></div>' +
        '<button id="menu-btn" type="button" class="lg:hidden shrink-0 rounded p-2 text-navy hover:bg-mint ' + F + '" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">' +
          '<svg aria-hidden="true" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button></div>' +
      // Row 2 (lg+): links on one line between thin borders
      '<nav aria-label="Main" class="hidden lg:block border-y border-gray-200"><div class="max-w-6xl mx-auto px-4 flex items-center gap-6 overflow-x-auto overflow-y-hidden no-scrollbar">' + navLinks(current()) + "</div></nav>" +
      // Mobile slide-down menu: search + links + profile/logout
      '<div id="mobile-menu" hidden class="lg:hidden border-y border-gray-200 bg-white px-4 py-3 space-y-1">' +
        '<form role="search" action="events.html" class="relative mb-2"><label for="m-search" class="sr-only">Search</label>' +
        '<span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-500">' + SEARCH_ICON + '</span>' +
        '<input id="m-search" name="q" type="search" placeholder="Search events..." class="w-full rounded border border-gray-300 pl-8 pr-3 py-2 text-sm ' + F + '"></form>' +
        '<div class="flex flex-col">' + navLinks(current(), true) +
          '<a href="profile.html" class="block whitespace-nowrap rounded px-3 py-2.5 text-sm font-medium text-navy hover:bg-mint ' + F + '">Profile (' + E(user.full_name) + ')</a>' +
          '<button type="button" data-logout class="text-left whitespace-nowrap rounded px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-mint ' + F + '">Log out</button></div></div>' +
      // Row 3: latest published announcement (filled by script; stays hidden if none)
      '<div id="announce-strip" hidden class="bg-navy text-white"><div class="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm whitespace-nowrap overflow-hidden">' +
        '<span class="shrink-0 text-xs font-bold tracking-wider text-gold">ANNOUNCEMENT</span>' +
        '<a id="announce-link" href="announcements.html" class="truncate underline-offset-2 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white"></a></div></div>' +
      '<div class="border-b border-gray-200 lg:hidden"></div></header>';
  }

  // Row 3 data: newest published announcement, same endpoint as announcements.html. Any failure just leaves the strip hidden.
  function loadAnnouncement() {
    if (!window.Api || !Auth.isLoggedIn()) return;
    Api.get("/announcements", null, { silent: true }).done((res) => {
      const a = (res.data || []).filter((x) => x.published !== false)
        .sort((x, y) => new Date(y.created_at) - new Date(x.created_at))[0];
      if (!a || !a.title) return;
      $("#announce-link").attr("href", "announcement.html?id=" + encodeURIComponent(a.id)).text(a.title);
      $("#announce-strip").prop("hidden", false);
    });
  }

  // Footer: quick links / contact / help hours / newsletter-style box (shows a toast only; nothing is sent).
  // NOTE: contact address, phone and hours are placeholders (.example is a reserved domain) - replace before deploying.
  const FL = "text-slate-300 hover:text-white underline-offset-2 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white";
  const footer = () =>
    '<footer id="site-footer" class="bg-navy-900 text-slate-300 text-sm"><div class="max-w-6xl mx-auto px-4 pt-12 pb-6">' +
    '<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">' +
    '<section aria-labelledby="ft-links"><h2 id="ft-links" class="text-white font-bold text-sm">Quick links</h2><ul class="mt-3 space-y-2">' +
    '<li><a class="' + FL + '" href="events.html">Events</a></li><li><a class="' + FL + '" href="announcements.html">Announcements</a></li>' +
    '<li><a class="' + FL + '" href="promos.html">Promos</a></li><li><a class="' + FL + '" href="profile.html">Your profile</a></li><li><a class="' + FL + '" href="contact.html">Contact us</a></li></ul></section>' +
    '<section aria-labelledby="ft-contact"><h2 id="ft-contact" class="text-white font-bold text-sm">Contact</h2><p class="mt-3">Questions or problems?<br>' +
    '<a class="' + FL + '" href="mailto:support@civicevents.example">support@civicevents.example</a><br>Phone: +250780677656<br><a class="' + FL + ' font-semibold" href="contact.html">Contact us &rarr;</a></p></section>' +
    '<section aria-labelledby="ft-hours"><h2 id="ft-hours" class="text-white font-bold text-sm">Help hours</h2><p class="mt-3">8:00 AM &ndash; 5:00 PM<br>Monday to Friday</p></section>' +
    '<section aria-labelledby="ft-news"><h2 id="ft-news" class="text-white font-bold text-sm">Newsletter</h2>' +
    '<form id="newsletter-form" class="mt-3 flex" novalidate><label for="newsletter-email" class="sr-only">Email address</label>' +
    '<input id="newsletter-email" type="email" autocomplete="email" placeholder="Email address" class="min-w-0 flex-1 rounded-l border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">' +
    '<button type="submit" class="rounded-r bg-white px-3 py-2 text-xs font-bold text-navy hover:bg-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900">Submit</button></form></section></div>' +
    '<p class="mt-10 border-t border-white/15 pt-4 text-xs text-slate-300">&copy; ' + new Date().getFullYear() + ' Civic Events. Community, together.</p></div></footer>';

  function toggle($btn, $panel, label) {
    const open = $panel.prop("hidden");
    $panel.prop("hidden", !open);
    $btn.attr("aria-expanded", String(open));
    if (label) $btn.attr("aria-label", (open ? "Close " : "Open ") + label);
  }

  function init() {
    $("<style>").text(css).appendTo("head");
    if ($("body").is("[data-bare]")) return; // login/signup: theme only
    $("body").addClass("bg-ivory text-slate-800 min-h-screen flex flex-col")
      .prepend('<a href="#main-content" class="skip-link btn-primary">Skip to content</a>');
    // Fill the pre-sized placeholders (no layout shift); fall back to inserting if a page lacks them.
    const $h = $("#site-header"), $f = $("#site-footer");
    $h.length ? $h.replaceWith(header()) : $("body").prepend(header());
    $f.length ? $f.replaceWith(footer()) : $("body").append(footer());
    $("#main-content").addClass("flex-1").attr("tabindex", "-1").addClass("focus:outline-none"); // lets the skip link move focus

    const $pb = $("#profile-btn"), $pm = $("#profile-menu"), $mb = $("#menu-btn"), $mm = $("#mobile-menu");
    $pb.on("click", () => { toggle($pb, $pm); if (!$pm.prop("hidden")) $pm.find("a,button").first().trigger("focus"); });
    $mb.on("click", () => toggle($mb, $mm, "menu"));
    // Close dropdown on outside click / Escape (returns focus to trigger); arrow keys move within menu.
    $(document).on("click", (e) => { if (!$(e.target).closest("#profile-btn,#profile-menu").length && !$pm.prop("hidden")) toggle($pb, $pm); });
    $(document).on("keydown", (e) => {
      if (e.key === "Escape" && !$pm.prop("hidden")) { toggle($pb, $pm); $pb.trigger("focus"); }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && $.contains($pm[0], document.activeElement)) {
        e.preventDefault();
        const items = $pm.find("[role=menuitem]").get(), i = items.indexOf(document.activeElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      }
    });
    $("#newsletter-form").on("submit", (e) => {
      e.preventDefault();
      const v = $("#newsletter-email").val().trim();
      if (!/^\S+@\S+\.\S+$/.test(v)) return UI.toast("Enter a valid email address.", "error");
      $("#newsletter-email").val("");
      UI.toast("Thanks! You're on the list.", "success");
    });
    // Shows the "no permission" message left by Auth.requireAdmin() before it redirected.
    try { const t = sessionStorage.getItem("ce_toast"); if (t) { sessionStorage.removeItem("ce_toast"); UI.toast(t, "error"); } } catch (e) {}
    $("#logout-btn, [data-logout]").on("click", () => { Auth.clear(); location.replace("login.html"); });
    loadAnnouncement();

    // Notifications (bell drawer + polling): load js/notifications.js on demand if the page didn't include it.
    if (Auth.isLoggedIn()) {
      if (window.Notifications) Notifications.init();
      else $.getScript("js/notifications.js").done(() => window.Notifications && Notifications.init());
    }
  }

  // Placeholder hook: call from the notifications code when it exists.
  function setUnread(n) {
    $("[data-unread]").text(n > 99 ? "99+" : n).toggleClass("hidden", !n);
    $("[data-bell]").attr("aria-label", "Notifications (" + n + " unread)");
  }

  // Reveal once Tailwind has processed the injected markup (see css/app.css, body:not(.ready)).
  const reveal = () => requestAnimationFrame(() => $("body").addClass("ready"));
  $(() => { init(); reveal(); });
  setTimeout(() => $("body").addClass("ready"), 2000); // safety net if init throws
  return { setUnread };
})();
