# Pixel Palette Backend API

API for Pixel Palette, a retro/pixel art social network. Built with Clean Architecture using a hybrid database model (PostgreSQL for relational data, MongoDB for documents/analytics).

## Tech Stack
- **Node.js 20+**, **Express 4+**, **TypeScript 5+** (Strict mode)
- **PostgreSQL 14+** (via `pg`)
- **MongoDB Atlas** (via `mongoose`)
- **Security:** `helmet`, `hpp`, `cors`, `express-rate-limit`
- **Logging:** `pino`, `pino-http`
- **Validation:** `zod`
- **Testing:** `vitest`, `supertest`

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and fill the variables.
   ```bash
   cp .env.example .env
   ```
   **Variables:**
   - `PORT`: Server port (default 3000)
   - `DATABASE_URL`: PostgreSQL connection string
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`: Secrets for signing tokens
   - `CORS_ORIGINS`: Comma separated allowed origins (or `*`)

3. Run in development mode:
   ```bash
   npm run dev
   ```

## Available Scripts
- `npm run dev` - Run dev server with hot-reload (`tsx watch`)
- `npm run build` - Compile TypeScript to `dist/`
- `npm start` - Run compiled server
- `npm test` - Run tests with Vitest
- `npm run seed` - Seed database with demo data
- `npm run lint` / `npm run format` - Code quality tools

## Folder Structure
```
src/
├── __tests__/         # Integration and unit tests
├── config/            # Environment, DB connections, Logger
├── middlewares/       # Error handling, Auth, Validation
├── models/            # Schema files (SQL) and Mongoose models (Mongo)
├── modules/           # Business logic (Clean Architecture)
│   ├── auth/          # Authentication & user creation
│   ├── comments/      # Comments & Likes on posts
│   ├── followers/     # Follow/Unfollow users
│   ├── guestbook/     # Profile guestbook entries
│   ├── notifications/ # User notifications
│   ├── posts/         # Feed & Post CRUD
│   ├── profiles/      # User profiles & settings
│   └── themes/        # Custom CSS profile themes
├── scripts/           # DB Seed scripts
├── types/             # Shared TypeScript types
└── utils/             # Helpers (Errors, Hash, JWT, Pagination)
```

## Endpoints Summary

| Method | Path | Auth? | Description |
|--------|------|-------|-------------|
| **Auth** ||||
| `POST` | `/api/auth/signup` | No | Create new user and profile |
| `POST` | `/api/auth/login` | No | Login and get tokens |
| `POST` | `/api/auth/refresh` | No | Get new tokens via refresh token |
| `GET`  | `/api/auth/me` | Yes | Get current user info |
| **Profiles** ||||
| `GET`  | `/api/profiles/:username` | No | Get public profile and counts |
| `PATCH`| `/api/profiles/me` | Yes | Update profile info |
| `GET`  | `/api/profiles/:username/posts` | No | Get paginated posts of a user |
| **Followers** ||||
| `POST` | `/api/followers/:username` | Yes | Follow a user |
| `DELETE`| `/api/followers/:username` | Yes | Unfollow a user |
| `GET`  | `/api/profiles/:username/followers` | No | List followers |
| `GET`  | `/api/profiles/:username/following` | No | List following |
| **Posts** ||||
| `GET`  | `/api/posts` | No | Get public feed |
| `GET`  | `/api/posts/:id` | No | Get post details |
| `POST` | `/api/posts` | Yes | Create a new post |
| `PATCH`| `/api/posts/:id` | Yes | Edit post (owner only) |
| `DELETE`| `/api/posts/:id` | Yes | Delete post (owner only) |
| **Comments & Likes** ||||
| `GET`  | `/api/posts/:postId/comments` | No | List comments on a post |
| `POST` | `/api/posts/:postId/comments` | Yes | Comment on a post |
| `DELETE`| `/api/comments/:id` | Yes | Delete a comment |
| `POST` | `/api/posts/:postId/like` | Yes | Like a post |
| `DELETE`| `/api/posts/:postId/like` | Yes | Unlike a post |
| **Notifications** ||||
| `GET`  | `/api/notifications` | Yes | Get your notifications |
| `GET`  | `/api/notifications/unread-count` | Yes | Get unread count |
| `PATCH`| `/api/notifications/read-all` | Yes | Mark all as read |
| `PATCH`| `/api/notifications/:id/read` | Yes | Mark one as read |
| **Themes** ||||
| `GET`  | `/api/themes/:username` | No | Get user's custom theme |
| `PUT`  | `/api/themes/me` | Yes | Upsert theme (CSS sanitized) |
| **Guestbook** ||||
| `GET`  | `/api/guestbook/:username` | No | Get user's guestbook |
| `POST` | `/api/guestbook/:username` | Yes | Sign a guestbook |
| `DELETE`| `/api/guestbook/:id` | Yes | Delete an entry |

## ER Diagram (PostgreSQL)
```
+-------------+      +----------------+
|    users    | 1:1  |    profiles    |
|-------------|----->|----------------|
| id (PK)     |      | id (PK)        |
| email       |      | user_id (FK)   |
| password    |      | username       |
+-------------+      | display_name   |
                     | bio, mood      |
                     | avatar_url     |
                     +----------------+
                        |   |   |   |
      +-----------------+   |   |   +-----------------------+
      |                     |   |                           |
 1:N  v                 1:N v   v 1:N                       v 1:N
+---------------+   +-----------+   +-------------------+  +-------------------+
|     posts     |   | followers |   | guestbook_entries |  |      likes        |
|---------------|   |-----------|   |-------------------|  |-------------------|
| id (PK)       |   | follower  |   | profile_id (FK)   |  | user_id (FK)      |
| author_id (FK)|   | following |   | author_id (FK)    |  | post_id (FK)      |
| content       |   +-----------+   | message           |  +-------------------+
| title, tags   |                   +-------------------+
+---------------+
        | 1:N
        v
+------------------+
|     comments     |
|------------------|
| id (PK)          |
| post_id (FK)     |
| author_id (FK)   |
| content          |
+------------------+
```
