// $.ajax wrapper. Usage: Api.get('/events').done(res => ...).fail(err => err.message)
// Resolves with the parsed body; rejects with {status, message, errors}.
// Pass {silent:true} as the last arg to skip the automatic toasts/redirects.
const Api = (() => {
  function friendly(xhr) {
    const s = xhr.status, body = xhr.responseJSON || {};
    if (s === 0) return "Can't reach the server. Check your connection and try again.";
    if (body.message && s >= 400 && s < 500) return body.message;
    if (s === 404) return "We couldn't find what you asked for.";
    if (s >= 500) return "Something went wrong on our side. Please try again shortly.";
    return body.message || "Something went wrong. Please try again.";
  }

  function request(method, path, data, opts) {
    opts = opts || {};
    const isForm = data instanceof FormData;
    const isGet = method === "GET";
    const token = Auth.getToken();
    const d = $.Deferred();
    $.ajax({
      url: API_BASE + path,
      method: method,
      headers: token ? { Authorization: "Bearer " + token } : {},
      // FormData: browser sets the multipart boundary. JSON: stringify. GET: query string.
      data: data == null ? undefined : (isForm || isGet) ? data : JSON.stringify(data),
      processData: isGet && !isForm,
      contentType: isForm ? false : isGet ? undefined : "application/json",
      dataType: "json",
      // Optional upload progress: pass {onProgress: pct => ...}
      xhr: opts.onProgress ? function () {
        const x = $.ajaxSettings.xhr();
        if (x.upload) x.upload.addEventListener("progress", (e) => { if (e.lengthComputable) opts.onProgress(Math.round(e.loaded / e.total * 100)); });
        return x;
      } : undefined,
    }).done((res) => d.resolve(res))
      .fail((xhr) => {
        const err = { status: xhr.status, message: friendly(xhr), errors: (xhr.responseJSON || {}).errors || [] };
        if (xhr.status === 401 && token && !opts.silent) {
          // Only treat as expired when we sent a token (a 401 on login = wrong password, shown inline).
          Auth.clear();
          try { sessionStorage.setItem("ce_flash", "Your session expired. Please log in again."); } catch (e) {}
          location.replace("login.html");
        } else if (xhr.status === 403 && !opts.silent) {
          UI.toast("You don't have permission to do that. Please contact an admin.", "error");
        } else if (!opts.silent && (xhr.status === 0 || xhr.status >= 500)) {
          UI.toast(err.message, "error");
        }
        d.reject(err);
      });
    return d.promise();
  }

  return {
    get: (p, q, o) => request("GET", p, q, o),
    post: (p, b, o) => request("POST", p, b, o),
    put: (p, b, o) => request("PUT", p, b, o),
    patch: (p, b, o) => request("PATCH", p, b, o),
    del: (p, o) => request("DELETE", p, null, o),
  };
})();
