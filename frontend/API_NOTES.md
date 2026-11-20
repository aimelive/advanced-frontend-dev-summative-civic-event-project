# API Notes (base: `http://localhost:4000/api`)

All routes need `Authorization: Bearer <jwt>` except `/auth/*`. Uploads are served from `http://localhost:4000` (UPLOADS_BASE).

**Envelope:** success `{status, message, data}`; error `{status, message, errors?: [{field, message}]}`.
**Statuses:** 400 validation, 401 bad/expired token (or bad login), 403 not admin, 409 duplicate email.

| Method | Path | Role | Body / notes |
|---|---|---|---|
| POST | /auth/signup | public | `full_name, email, password(min 6), role?` -> 201 user |
| POST | /auth/login | public | `email, password` -> `data:{token, user:{id,full_name,email,role}}` |
| GET | /users | admin | paginated list |
| GET | /users/:id | admin | |
| PATCH | /users/:id/enable | admin | |
| PATCH | /users/:id/disable | admin | |
| GET | /users/profile/me | user | own profile |
| PATCH | /users/profile/me | user | `full_name?, email?` (no role/is_active) |
| GET | /events | user | list |
| GET | /events/:id | user | |
| POST | /events | admin | **FormData** `title, location, starts_at, ends_at, image(file)` + others |
| PUT | /events/:id | admin | FormData, optional `image` |
| DELETE | /events/:id | admin | |
| POST | /event-registrations/register | user | `{event_id}` |
| POST | /event-registrations/cancel | user | `{event_id}` |
| GET | /event-registrations/my-registrations | user | |
| GET | /event-registrations/event/:event_id/attendees | admin | |
| POST | /event-feedback | user | fields: see controller |
| PUT | /event-feedback/:id | user | |
| GET | /event-feedback/my-feedback | user | |
| GET | /event-feedback/event/:event_id | admin | |
| GET | /announcements | user | |
| GET | /announcements/:id | user | |
| POST | /announcements | admin | **FormData** `title, published?(bool), audio(file)` + others |
| PUT | /announcements/:id | admin | FormData `title`, optional `audio` |
| PATCH | /announcements/:id/publish | admin | |
| PATCH | /announcements/:id/unpublish | admin | |
| DELETE | /announcements/:id | admin | |
| GET | /promos | user | |
| GET | /promos/:id | user | |
| POST | /promos | admin | **FormData** `title, description, caption_text, video(file)` |
| PUT | /promos/:id | admin | FormData, same required fields |
| PATCH | /promos/:id/publish | admin | |
| PATCH | /promos/:id/unpublish | admin | |
| DELETE | /promos/:id | admin | |
| GET | /notifications | user | list (unread count derived client-side) |
| GET | /notifications/:id | user | |
| DELETE | /notifications/:id | admin | |
| GET | /dashboard/me | user | user dashboard data |
| GET | /dashboard/admin | admin | admin dashboard data |

Gaps: no search endpoint, no mark-as-read for notifications; pagination params and response fields not verified (check controllers).
