# Consent Management System

A Node.js/Express/MongoDB application for managing consent banners and collecting consent from end-users via an email+JWT verification flow.

## Features

- User registration with email verification
- JWT-based authentication (httpOnly cookie)
- Password reset via email link
- Create and manage consent banners
- Public banner pages for collecting consent
- Email-based consent verification flow (accept/reject)
- Dashboard with consent records per banner

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs (use a long random string) |
| `SENDGRID_API_KEY` | SendGrid API key for sending emails |
| `FROM_EMAIL` | Verified sender email address in SendGrid |
| `BASE_URL` | Your app's base URL (e.g. `http://localhost:3000`) |
| `PORT` | Server port (default: 3000) |

### 3. Start the server

```bash
node server.js
```

## Usage Flow

1. **Register** at `/register` — check your email and click the verification link
2. **Log in** at `/login`
3. **Create a banner** at `/banners/new` — give it a name, description, and subscription types
4. **Share the public URL** — shown on the banner detail page (e.g. `/b/my-banner-abc12345`)
5. **End-users visit the public URL** — enter their email to receive a consent request
6. **End-users click the email link** — they see an accept/reject form
7. **View consent records** — on the banner detail page in your dashboard

## Project Structure

```
├── server.js               # Entry point
├── config/db.js            # MongoDB connection
├── models/
│   ├── User.js
│   ├── Banner.js
│   └── Consent.js
├── middleware/auth.js       # JWT auth middleware
├── routes/
│   ├── auth.js             # Register, login, verify, reset
│   ├── banners.js          # Dashboard, banner CRUD
│   └── consent.js          # Public banner + consent flow
└── views/                  # EJS templates
```
