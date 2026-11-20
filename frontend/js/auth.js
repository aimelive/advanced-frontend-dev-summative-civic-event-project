// Auth storage + page guards.
// SECURITY TRADEOFF: "remember me" -> localStorage (survives browser restarts, but the token is readable
// by any XSS and lingers on shared machines). Otherwise sessionStorage (cleared when the tab closes;
// safer). Either way the token is JS-readable, so never render untrusted HTML. Client-side role checks
// are UX only - the backend's authorize() is the real enforcement.
const Auth = (() => {
  const TK = "ce_token", UK = "ce_user";
  const read = (k) => { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch (e) { return null; } };

  function clear() {
    [localStorage, sessionStorage].forEach((s) => { try { s.removeItem(TK); s.removeItem(UK); } catch (e) {} });
  }
  function save(token, user, remember) {
    clear();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TK, token);
    store.setItem(UK, JSON.stringify({ id: user.id, full_name: user.full_name, role: user.role }));
  }
  const getToken = () => read(TK);
  function getUser() { try { return JSON.parse(read(UK)); } catch (e) { return null; } }
  const isLoggedIn = () => !!getToken() && !!getUser();
  // ROLE GUARD: role comes from the stored login user (UI only); the server re-checks every admin route.
  const isAdmin = () => !!getUser() && getUser().role === "admin";

  // ROLE/STATUS GUARD (UI only): disabled accounts are signed out client-side. The backend does NOT enforce
  // is_active (a disabled user's token still works against the API), so this is a courtesy check, not security.
  // Silent GET /users/profile/me; resolves true if the user may continue, false if they were just signed out.
  // Network/API failures resolve true (never lock people out because of a hiccup).
  function checkActive() {
    const d = $.Deferred();
    if (!window.Api) return d.resolve(true).promise();
    Api.get("/users/profile/me", null, { silent: true }).done((res) => {
      if (res && res.data && res.data.is_active === false) {
        clear();
        try { sessionStorage.setItem("ce_flash", "Your account has been disabled. Contact an admin."); } catch (e) {}
        location.replace("login.html");
        d.resolve(false);
      } else d.resolve(true);
    }).fail(() => d.resolve(true));
    return d.promise();
  }

  // ROLE GUARD: any logged-in user. Anonymous visitors are sent to login.
  // Also runs the STATUS GUARD above on every page load (async; the page may redirect shortly after it starts).
  function requireAuth() {
    if (!isLoggedIn()) { location.replace("login.html"); return false; }
    checkActive();
    return true;
  }
  // ROLE GUARD: admin only. Anonymous -> login; non-admin -> dashboard. UX only; server also enforces.
  function requireAdmin() {
    if (!requireAuth()) return false;
    if (!isAdmin()) {
      // Toast is shown by layout.js on the next page (survives the redirect).
      try { sessionStorage.setItem("ce_toast", "You don't have permission to open that page."); } catch (e) {}
      location.replace("dashboard.html"); return false;
    }
    return true;
  }
  return { save, getToken, getUser, clear, isLoggedIn, isAdmin, requireAuth, requireAdmin, checkActive };
})();
const isAdmin = Auth.isAdmin;
const requireAuth = Auth.requireAuth;
const requireAdmin = Auth.requireAdmin;
