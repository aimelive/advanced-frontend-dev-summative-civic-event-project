// Small helpers shared by events.html, event.html and event-form.html.
const EventUtils = (() => {
  // Image lives in metadata.image_url; may be absolute or relative to the uploads host.
  function imageUrl(ev) {
    const u = ev && ev.metadata && ev.metadata.image_url;
    if (!u) return "";
    return /^https?:/.test(u) ? u : UPLOADS_BASE + (u.charAt(0) === "/" ? "" : "/") + u;
  }
  const fmt = (d, opts) => (d && !isNaN(new Date(d)) ? new Date(d).toLocaleString([], opts) : "");
  const DT = { dateStyle: "medium", timeStyle: "short" };
  const dateTime = (d) => fmt(d, DT);
  // "Jan 5, 2026, 6:00 PM - 8:00 PM" (end date repeated only when it differs)
  function range(ev) {
    const s = new Date(ev.starts_at), e = ev.ends_at ? new Date(ev.ends_at) : null;
    if (isNaN(s)) return "Date to be announced";
    if (!e || isNaN(e)) return dateTime(s);
    return dateTime(s) + " - " + (s.toDateString() === e.toDateString() ? e.toLocaleTimeString([], { timeStyle: "short" }) : dateTime(e));
  }
  // Admins see everything; others only published !== false (server doesn't filter).
  // ROLE GUARD: admins see unpublished items; users only see published ones.
  const visible = (ev) => isAdmin() || ev.published !== false;
  // Value for <input type="datetime-local"> from an ISO string (local time).
  function toLocalInput(d) {
    const x = new Date(d);
    if (isNaN(x)) return "";
    return new Date(x - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  // Registrations may come back as {event_id} or {event:{id}}.
  const regEventId = (r) => String(r.event_id != null ? r.event_id : r.event && r.event.id);
  return { imageUrl, dateTime, range, visible, toLocalInput, regEventId };
})();
