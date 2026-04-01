# API Ownership Audit

This audit checks whether endpoints follow the rule:

- authenticate by `email`
- authorize by `accountType`
- scope business data by `profileId` or authenticated `userId`

## Already Follows The Rule

- `GET /api/ahrm/v3/admin/overview`
  - Uses authenticated user identity and checks `ADMIN` role in service layer.
- `GET /api/ahrm/v3/profiles/me`
  - Uses authenticated user's `profileId`.
- `PUT /api/ahrm/v3/profiles/me`
  - Uses authenticated user's `profileId` and ignores client-owned identity.
- `PATCH /api/ahrm/v3/profiles/me`
  - Uses authenticated user's `profileId` and ignores client-owned identity.
- `POST /api/ahrm/v3/profiles/me/uploadResume`
  - Uses authenticated user's `profileId`.
- `GET /api/ahrm/v3/notification/me`
  - Uses authenticated user's `userId`.
- `GET /api/ahrm/v3/jobs/me/posted`
  - Uses authenticated employer user ID for ownership.
- `GET /api/ahrm/v3/jobs/me/history/{applicationStatus}`
  - Uses authenticated applicant user ID for ownership.
- `POST /api/ahrm/v3/jobs/me/applications/{jobId}`
  - Uses authenticated user identity for applicant ownership and ignores caller-supplied applicant identity.
- `GET /api/ahrm/v3/users/me`
  - Uses authenticated email from the security context.

## Partially Follows The Rule

- `GET /api/ahrm/v3/profiles/get/{id}`
  - Now enforces ownership for non-admin users, but still exposes an ID-based self-service route.
- `PUT /api/ahrm/v3/profiles/update`
  - Now enforces ownership for non-admin users, but still accepts ID in payload.
- `PATCH /api/ahrm/v3/profiles/{id}`
  - Now enforces ownership for non-admin users, but still exposes a caller-supplied path ID.
- `POST /api/ahrm/v3/profiles/uploadResume`
  - Now enforces ownership for non-admin users, but still accepts caller-supplied `profileId`.
- `GET /api/ahrm/v3/notification/get/{userId}`
  - Now enforces ownership for non-admin users, but still accepts caller-supplied `userId`.
- `PUT /api/ahrm/v3/notification/read/{id}`
  - Now validates ownership by notification owner or admin, but still relies on notification lookup rather than principal-scoped pathing.

## Does Not Follow The Rule Yet

- `POST /api/ahrm/v3/jobs/post`
  - Ownership now comes from authenticated user, but path is still a generic endpoint rather than a dedicated self-service route.
- `POST /api/ahrm/v3/jobs/postAll`
  - Ownership now comes from authenticated user, but path is still a generic endpoint rather than a dedicated self-service route.
- `DELETE /api/ahrm/v3/jobs/delete/{id}`
  - Ownership enforced for employer/admin, but still path-parameter based.
- `POST /api/ahrm/v3/jobs/apply/{id}`
  - Applicant identity now comes from authenticated user, but a dedicated `/me` route is preferred for self-service callers.
- `GET /api/ahrm/v3/jobs/postedBy/{id}`
  - Ownership enforced for non-admin users, but a `/me` variant is preferred and now exists.
- `GET /api/ahrm/v3/jobs/history/{id}/{applicationStatus}`
  - Ownership enforced for non-admin users, but a `/me` variant is preferred and now exists.
- `POST /api/ahrm/v3/jobs/changeAppStatus`
  - Employer/admin ownership is now enforced, but the payload shape is still generic.
- `GET /api/ahrm/v3/profiles/getAll`
  - Returns all profiles without role-based restriction.

## Public Or Anonymous By Design

- `POST /api/ahrm/v3/auth/login`
- `POST /api/ahrm/v3/users/register`
- `POST /api/ahrm/v3/users/changePass`
- `POST /api/ahrm/v3/users/sendOtp/{email}`
- `GET /api/ahrm/v3/users/verifyOtp/{email}/{otp}`
- `GET /api/dashboard`
- `GET /api/dashboard/{audience}`
- `GET /api/audiences`
- `GET /api/search`
- `GET /actuator/health`

## Security Config Gaps

- `GET /api/ahrm/v3/profiles/getAll` is authenticated but not role-limited.

## Recommended Next `/me` Endpoints

- `POST /api/ahrm/v3/jobs/me`
- `DELETE /api/ahrm/v3/jobs/me/{jobId}`
- `POST /api/ahrm/v3/jobs/me/status`
