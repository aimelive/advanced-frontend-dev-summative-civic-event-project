// Shared helpers for announcements (audio) and promos (video).
const Media = (() => {
  const url = (u) => !u ? "" : /^https?:/.test(u) ? u : UPLOADS_BASE + (u.charAt(0) === "/" ? "" : "/") + u;
  // ROLE GUARD: admins see unpublished items; users only see published ones.
  const visible = (x) => isAdmin() || x.published !== false;
  const fmtTime = (s) => {
    if (!isFinite(s)) return "0:00";
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  const fmtDate = (d) => { const x = new Date(d); return isNaN(x) ? "" : x.toLocaleDateString(undefined, { dateStyle: "medium" }); };

  // WebVTT Blob URL from plain caption text (one cue spanning the video; no timing data exists).
  function vttUrl(text) {
    const body = String(text || "").replace(/-->/g, "->").trim();
    return URL.createObjectURL(new Blob(["WEBVTT\n\n00:00:00.000 --> 99:59:59.000\n" + body + "\n"], { type: "text/vtt" }));
  }

  // Validates a file's type/size before upload. Returns an error string or "".
  function checkFile(file, types, maxMB, label) {
    if (types.indexOf(file.type) < 0) return "Please choose a " + label + " file.";
    if (file.size > maxMB * 1024 * 1024) return "File is too large (max " + maxMB + " MB).";
    return "";
  }

  // ROLE GUARD: UI only: admin controls (publish toggle, edit, delete) for a list card. Server enforces too.
  // opts: {base:"/promos", editHref, noun, item, onChange(), onDelete()}
  function adminActions(o) {
    const $a = $('<div class="flex flex-wrap gap-2"></div>');
    if (!isAdmin()) return $a;
    const x = o.item, t = x.title;
    const $p = $('<button type="button" class="btn-secondary"></button>');
    const label = () => $p.text(x.published === false ? "Publish" : "Unpublish").attr("aria-label", (x.published === false ? "Publish " : "Unpublish ") + t);
    label();
    $p.on("click", function () {
      const pub = x.published === false;
      UI.loading($p, true, "Saving...");
      Api.patch(o.base + "/" + x.id + (pub ? "/publish" : "/unpublish")).done(function () {
        x.published = pub; UI.toast(o.noun + (pub ? " published." : " unpublished."), "success");
        UI.loading($p, false); label(); if (o.onChange) o.onChange();
      }).fail(function (err) { UI.loading($p, false); UI.toast(err.message, "error"); });
    });
    const $e = $('<a class="btn-secondary">Edit</a>').attr({ href: o.editHref + "?id=" + encodeURIComponent(x.id), "aria-label": "Edit " + t });
    const $d = $('<button type="button" class="btn-secondary text-red-700">Delete</button>').attr("aria-label", "Delete " + t);
    $d.on("click", function () {
      UI.confirm({ title: "Delete " + o.noun.toLowerCase() + "?", message: '"' + t + '" will be permanently removed.', confirmText: "Delete", danger: true }).then(function (ok) {
        if (!ok) return;
        Api.del(o.base + "/" + x.id).done(function () { UI.toast(o.noun + " deleted.", "success"); o.onDelete(x); })
          .fail(function (err) { UI.toast(err.message, "error"); });
      });
    });
    return $a.append($p, $e, $d);
  }

  return { url, visible, fmtTime, fmtDate, vttUrl, checkFile, adminActions };
})();
