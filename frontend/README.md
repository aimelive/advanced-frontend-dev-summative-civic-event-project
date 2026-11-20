# Civic Events - Frontend

Static multi-page UI for the Civic Events API (events, registrations, feedback, announcements, promos, notifications, admin tools).

## Features
- Sign up / log in (optional "remember me"), profile editing
- Events: browse, search, view, register / cancel, feedback (users); create / edit / delete with image upload (admins)
- My registrations
- Announcements (audio) and promos (video with captions); admins create, edit, publish / unpublish, delete
- Notifications bell + drawer, full notifications page (admins can delete)
- User dashboard and admin dashboard (stat cards, SVG charts, 60s auto refresh)
- Admin user management: search, filter, enable / disable with confirm, details modal
- Accessible: skip links, labelled forms, aria-live toasts, focus styles, responsive layouts

## Tech stack
HTML5, Tailwind CSS (CDN), jQuery 3.7 (CDN), vanilla JS modules in `js/`. No build step.

## Folder structure
```
frontend/
  *.html            one file per page (login, signup, dashboard, events, event, event-form,
                    announcements, announcement, announcement-form, promos, promo, promo-form,
                    my-registrations, notifications, profile, admin, admin-dashboard)
  js/config.js      API_BASE and UPLOADS_BASE
  js/auth.js        token storage + role guards (requireAuth / requireAdmin)
  js/api.js         $.ajax wrapper (Api.get/post/put/patch/del, error handling, 401 redirect)
  js/ui.js          toast, confirm modal, skeleton, empty/error states
  js/layout.js      injects skip link, navbar, footer
  js/admin-nav.js   admin sidebar
  js/notifications.js, event-utils.js, media-utils.js   feature helpers
  API_NOTES.md      endpoint reference
```
Script order on every page: Tailwind, jQuery, `config.js`, `auth.js`, `api.js`, `ui.js`, `layout.js`, then page helpers.

## Run the backend
1. Install PostgreSQL and create a database named `civic-events-db`.
2. In `backend/`, create/edit `.env` with `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME=civic-events-db`, `JWT_SECRET`.
3. Run the migration: `psql -U <user> -d civic-events-db -f migrations/001_create_tables.sql`
4. `npm install`
5. `npm run dev` - API listens on http://localhost:4000

## Create an admin
Sign-up accepts a role, so create the first admin with:
```
curl -X POST http://localhost:4000/api/auth/signup -H "Content-Type: application/json" \
  -d '{"full_name":"Admin","email":"admin@example.com","password":"secret123","role":"admin"}'
```
(Note: the public sign-up form on `signup.html` does not send a role.)

## Run the frontend
Open the `frontend/` folder in VS Code and use **Live Server** (e.g. http://127.0.0.1:5500/login.html). If the API is elsewhere, edit `API_BASE` / `UPLOADS_BASE` in `js/config.js`.

## Role guards
Client-side guards are UX only; the backend enforces access.
- `requireAdmin()` (non-admins go to dashboard): `admin.html`, `admin-dashboard.html`, `announcement-form.html`, `event-form.html`, `promo-form.html`
- `requireAuth()` (anonymous go to login): `dashboard.html`, `events.html`, `event.html`, `announcements.html`, `announcement.html`, `promos.html`, `promo.html`, `my-registrations.html`, `notifications.html`, `profile.html`
- Disabled accounts (ROLE/STATUS GUARD): after login and on every `requireAuth()` page load, `Auth.checkActive()` silently calls `GET /users/profile/me`; if `is_active === false` the user is signed out and sent to `login.html` with "Your account has been disabled. Contact an admin." **The backend does not enforce this**: a disabled user's token still works against the API, so this is a UI courtesy only. If the check itself fails (network/API error) the user is not signed out.
- Guard definitions: `js/auth.js`; admin-only nav links: `js/layout.js`; admin-only controls inside shared pages (edit/delete/publish) are gated with `isAdmin()`.

## Role-based access
- **Everyone logged in:** browse published events, announcements and promos; register/cancel for events; leave feedback; see own registrations and notifications; edit own profile.
- **Users only:** Register/Cancel buttons, the feedback form, "My registrations".
- **Admins only:** Dashboard and Admin nav links, New/Edit/Delete/Publish controls, unpublished items (shown with a "Draft" badge), event attendees and all feedback, the "Registrations" attendee view, user management, notification delete. Admins see "Admins manage events" instead of Register/feedback.
- **Disabled accounts:** signed out on the next page load (UI only, see above).
- Every client-side guard is marked `ROLE GUARD:` in the code; search for it to find them. The backend must enforce all of this too.

## Known backend limits
- No service-requests module
- No mark-as-read endpoint for notifications (read state is stored in the browser, per user)
- No search endpoint and no usable pagination metadata: search, filtering and pagination are client-side (`GET /users` returns a plain array)
- Video captions come from the promo's `caption_text` field
