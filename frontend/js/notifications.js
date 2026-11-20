// Notifications: shared store (read-state in localStorage per user, optimistic) + bell slide-over drawer.
// Backend has no mark-read endpoint, so read IDs live client-side only. Polls GET /notifications every 60s.
// Public API: Notifications.init(), .load(), .items(), .isRead(id), .markRead(id), .markAllRead(),
//   .unreadCount(), .relTime(iso), .icon(type), .metaOf(n), .linkFor(n), .on(fn) (subscribe to changes).
(function () {
  const E = UI.escapeHtml;
  const F = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2";
  let list = [], read = null, started = false, loadedOnce = false;
  const subs = [];

  const key = () => "ce_read_" + ((Auth.getUser() || {}).id || "anon");
  function readSet() {
    if (!read) { try { read = new Set(JSON.parse(localStorage.getItem(key()) || "[]")); } catch (e) { read = new Set(); } }
    return read;
  }
  function persist() { try { localStorage.setItem(key(), JSON.stringify([...readSet()])); } catch (e) {} }
  const isRead = (id) => readSet().has(String(id));
  const unreadCount = () => list.filter((n) => !isRead(n.id)).length;
  function changed() { Layout.setUnread(unreadCount()); subs.forEach((f) => f()); }

  function markRead(id) { if (!isRead(id)) { readSet().add(String(id)); persist(); changed(); } }
  function markAllRead() { list.forEach((n) => readSet().add(String(n.id))); persist(); changed(); }

  function load() {
    return Api.get("/notifications", null, { silent: true }).done((res) => {
      list = (res.data || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      loadedOnce = true; changed();
    });
  }

  function relTime(iso) {
    const s = (new Date(iso) - Date.now()) / 1000, a = Math.abs(s);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    if (a < 60) return "just now";
    if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
    if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
    if (a < 2592000) return rtf.format(Math.round(s / 86400), "day");
    return new Date(iso).toLocaleDateString();
  }

  const ICONS = { event: "📅", promo: "🎉", announcement: "📢", system: "⚙️" };
  const icon = (t) => ICONS[String(t || "").toLowerCase()] || "🔔";

  function metaOf(n) {
    let m = n.metadata;
    if (typeof m === "string") { try { m = JSON.parse(m); } catch (e) { m = null; } }
    return m && typeof m === "object" ? m : {};
  }
  // Related-item link from metadata (event_id / promo_id / announcement_id).
  function linkFor(n) {
    const m = metaOf(n);
    if (m.event_id) return { href: "event.html?id=" + encodeURIComponent(m.event_id), label: "View event" };
    if (m.promo_id) return { href: "promo.html?id=" + encodeURIComponent(m.promo_id), label: "View promo" };
    if (m.announcement_id) return { href: "announcement.html?id=" + encodeURIComponent(m.announcement_id), label: "View announcement" };
    return null;
  }

  // ---- Drawer ----
  let $drawer = null, $back = null, prevFocus = null;
  function renderDrawer() {
    if (!$drawer) return;
    const $l = $drawer.find("#nd-list").empty();
    const top = list.slice(0, 15);
    if (!top.length) return $l.html(UI.emptyState(loadedOnce ? "No notifications" : "Loading...", loadedOnce ? "You're all caught up." : ""));
    top.forEach((n) => {
      const unread = !isRead(n.id);
      const $li = $("<li></li>");
      const $b = $('<button type="button" class="w-full text-left flex gap-3 p-3 rounded hover:bg-mint ' + F + (unread ? " bg-brand-50" : "") + '"></button>')
        .attr("data-id", n.id)
        .append('<span aria-hidden="true" class="text-xl">' + icon(n.type) + "</span>",
          $('<span class="min-w-0 flex-1"></span>').append(
            $('<span class="block text-sm font-medium text-slate-900"></span>').text(n.title),
            $('<span class="block text-sm text-slate-600 line-clamp-2"></span>').text(n.message),
            $('<span class="block text-xs text-slate-500 mt-0.5"></span>').text(relTime(n.created_at) + (unread ? " · Unread" : ""))));
      $l.append($li.append($b));
    });
  }
  function close() {
    if (!$drawer) return;
    $(document).off("keydown.nd");
    $drawer.remove(); $back.remove(); $drawer = $back = null;
    $("[data-bell]").attr("aria-expanded", "false");
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  }
  function open() {
    if ($drawer) return;
    prevFocus = document.activeElement;
    $back = $('<div class="fixed inset-0 z-[80] bg-black/40"></div>').on("click", close).appendTo("body");
    $drawer = $('<aside role="dialog" aria-modal="true" aria-labelledby="nd-title" class="fixed top-0 right-0 bottom-0 z-[81] w-full max-w-sm bg-white shadow-xl flex flex-col">' +
      '<div class="flex items-center justify-between p-4 border-b border-gray-200"><h2 id="nd-title" class="font-semibold text-lg">Notifications</h2>' +
      '<button type="button" data-close class="rounded-md p-2 hover:bg-mint ' + F + '" aria-label="Close notifications">✕</button></div>' +
      '<ul id="nd-list" class="flex-1 overflow-y-auto p-2 space-y-1"></ul>' +
      '<div class="p-3 border-t border-gray-200 flex justify-between"><button type="button" data-all class="btn-secondary">Mark all read</button>' +
      '<a href="notifications.html" class="btn-primary">View all</a></div></aside>').appendTo("body");
    $("[data-bell]").attr("aria-expanded", "true");
    $drawer.on("click", "[data-close]", close).on("click", "[data-all]", markAllRead)
      .on("click", "#nd-list button", function () {
        const id = $(this).data("id"); markRead(id);
        location.href = "notifications.html?id=" + encodeURIComponent(id); // detail view
      });
    $(document).on("keydown.nd", (e) => {
      if (e.key === "Escape") return close();
      if (e.key === "Tab") { // focus trap
        const f = $drawer.find("button,a[href]").filter(":visible").get(), i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    renderDrawer();
    $drawer.find("[data-close]").trigger("focus");
    if (!loadedOnce) load();
  }

  function init() {
    if (started || !Auth.isLoggedIn()) return;
    started = true;
    subs.push(renderDrawer);
    $(document).on("click", "[data-bell]", function (e) {
      if (/notifications\.html$/.test(location.pathname)) return; // already on the inbox
      e.preventDefault(); open();
    });
    $("[data-bell]").attr({ "aria-haspopup": "dialog", "aria-expanded": "false" });
    load();
    setInterval(load, 60000);
  }

  window.Notifications = { init, load, items: () => list, isRead, markRead, markAllRead, unreadCount, relTime, icon, metaOf, linkFor, on: (f) => subs.push(f) };
})();
