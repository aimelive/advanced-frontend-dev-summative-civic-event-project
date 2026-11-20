// Shared admin sidebar. Usage: AdminNav.mount("admin.html") inside a container with #admin-shell.
// ROLE GUARD: pages using this must call requireAdmin() first; links are UX only, server enforces.
const AdminNav = (() => {
  const items = [["admin-dashboard.html", "Dashboard"], ["admin.html", "Users"], ["events.html", "Events"],
    ["announcements.html", "Announcements"], ["promos.html", "Promos"], ["notifications.html", "Notifications"]];
  const F = "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal";

  function mount(active) {
    const links = items.map(([h, l]) =>
      '<a href="' + h + '" class="block rounded-md px-3 py-2 text-sm font-medium ' + F + ' ' +
      (h === active ? 'bg-brand-100 text-brand-700" aria-current="page' : 'text-slate-700 hover:bg-mint') + '">' + l + "</a>").join("");
    $("#admin-shell").prepend(
      '<div class="md:w-52 shrink-0">' +
      '<button id="side-btn" type="button" aria-expanded="false" aria-controls="side-nav" class="md:hidden btn-secondary w-full mb-2 ' + F + '">Admin menu</button>' +
      '<nav id="side-nav" aria-label="Admin" class="hidden md:block rounded-md bg-white border border-gray-200 p-2 space-y-1">' + links + "</nav></div>");
    $("#side-btn").on("click", function () {
      var open = $("#side-nav").toggleClass("hidden").is(":visible");
      $(this).attr("aria-expanded", String(open));
    });
  }
  return { mount };
})();
