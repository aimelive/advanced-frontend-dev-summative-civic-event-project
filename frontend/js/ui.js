// Shared UI helpers. Server/user text always goes through .text() or escapeHtml().
const UI = (() => {
  const escapeHtml = (s) => $("<div>").text(s == null ? "" : s).html();
  const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal";

  function toast(message, type) {
    let $c = $("#toast-region");
    if (!$c.length) {
      $c = $('<div id="toast-region" role="status" aria-live="polite" class="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:max-w-sm"></div>').appendTo("body");
    }
    const color = { success: "bg-emerald-700", error: "bg-red-700" }[type] || "bg-navy";
    const $t = $('<div class="text-white text-sm rounded shadow-lg px-4 py-3"></div>').addClass(color).text(message).appendTo($c);
    setTimeout(() => $t.fadeOut(200, () => $t.remove()), 4500);
  }

  // Skeleton placeholder grid: container.html(UI.skeleton(6))
  const skeleton = (n) =>
    '<div aria-busy="true" aria-label="Loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">' +
    '<div class="animate-pulse rounded-md bg-white border border-gray-200 p-4"><div class="h-32 bg-slate-200 rounded mb-3"></div><div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div><div class="h-3 bg-slate-200 rounded w-1/2"></div></div>'.repeat(n || 3) +
    "</div>";

  // Accessible confirm modal -> Promise<boolean>. Esc/backdrop cancel, Tab trapped, focus restored.
  function confirm(o) {
    o = Object.assign({ title: "Are you sure?", message: "", confirmText: "Confirm", danger: false }, o);
    return new Promise((resolve) => {
      const prev = document.activeElement;
      const yes = (o.danger ? "bg-red-600 hover:bg-red-700" : "bg-teal-700 hover:bg-teal-800") + " text-white rounded px-4 py-2 text-sm font-medium " + FOCUS;
      const $m = $('<div class="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">' +
        '<div role="alertdialog" aria-modal="true" aria-labelledby="cm-t" aria-describedby="cm-d" class="bg-white rounded-md shadow-xl max-w-md w-full p-6">' +
        '<h2 id="cm-t" class="text-lg font-semibold text-slate-900"></h2><p id="cm-d" class="mt-2 text-sm text-slate-600"></p>' +
        '<div class="mt-6 flex justify-end gap-2"><button type="button" data-no class="btn-secondary">Cancel</button>' +
        '<button type="button" data-yes class="' + yes + '"></button></div></div></div>');
      $m.find("#cm-t").text(o.title); $m.find("#cm-d").text(o.message); $m.find("[data-yes]").text(o.confirmText);
      const done = (v) => { $(document).off("keydown.cm"); $m.remove(); if (prev && prev.focus) prev.focus(); resolve(v); };
      $m.on("click", "[data-yes]", () => done(true)).on("click", "[data-no]", () => done(false));
      $m.on("click", (e) => { if (e.target === $m[0]) done(false); });
      $(document).on("keydown.cm", (e) => {
        if (e.key === "Escape") return done(false);
        if (e.key === "Tab") {
          const f = $m.find("button").get(), i = f.indexOf(document.activeElement);
          e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });
      $m.appendTo("body").find("[data-no]").trigger("focus");
    });
  }

  const emptyState = (title, message) =>
    '<div class="text-center py-12 px-4 rounded-md border border-dashed border-gray-300 bg-white">' +
    '<p class="font-medium text-slate-800">' + escapeHtml(title) + '</p>' +
    '<p class="mt-1 text-sm text-slate-500">' + escapeHtml(message || "") + "</p></div>";

  // Error state with Retry button rendered into $el.
  function errorState($el, message, onRetry) {
    const $s = $('<div role="alert" class="text-center py-12 px-4 rounded-md border border-red-200 bg-red-50">' +
      '<p class="font-medium text-red-800">Something went wrong</p><p class="mt-1 text-sm text-red-700" data-msg></p>' +
      '<button type="button" class="btn-secondary mt-4">Try again</button></div>');
    $s.find("[data-msg]").text(message);
    $s.find("button").on("click", onRetry);
    $el.empty().append($s);
  }

  // Button loading state: UI.loading($btn, true, "Saving...") / UI.loading($btn, false)
  function loading($btn, on, text) {
    $btn = $($btn);
    if (on) {
      $btn.data("label", $btn.html()).prop("disabled", true).attr("aria-busy", "true")
        .html('<span class="inline-block h-4 w-4 mr-2 align-[-2px] rounded-full border-2 border-current/40 border-t-current animate-spin"></span>')
        .append(document.createTextNode(text || "Loading..."));
    } else {
      $btn.prop("disabled", false).removeAttr("aria-busy");
      if ($btn.data("label") != null) $btn.html($btn.data("label"));
    }
  }

  return { toast, skeleton, confirm, emptyState, errorState, loading, escapeHtml };
})();
