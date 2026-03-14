# Consent Management System

A Node.js/Express/MongoDB application for managing **preference centers** and collecting granular subscription consent from end-users via an email+JWT verification flow.

## Features

- User registration with email verification
- JWT-based authentication (httpOnly cookie)
- Password reset via email link
- Create and manage preference centers with multiple subscription types
- Dynamic add/remove subscription types when creating a preference center
- Public preference center pages showing subscriptions in a table
- Email-based consent flow — users toggle each subscription on/off
- Dashboard showing all preference centers with subscription tables
- Admin detail view showing per-subscription consent status for each user

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
3. **Create a preference center** at `/banners/new`
   - Give it a name and description
   - Add multiple subscription types using the **+ Add Subscription** button (e.g. Newsletter, Promotions, Updates)
4. **Share the public URL** — shown on the preference center detail page (e.g. `/b/my-pref-center-abc12345`)
5. **End-users visit the public URL** — see the subscription table, enter their email to receive a preference link
6. **End-users click the email link** — they see a toggle for each subscription (ON by default) and can enable/disable each one before saving
7. **View consent records** — on the preference center detail page, a table shows each user's email and their per-subscription opt-in/opt-out status

## Project Structure

```
├── server.js               # Entry point
├── config/db.js            # MongoDB connection
├── models/
│   ├── User.js             # email, password (hashed), isVerified
│   ├── Banner.js           # name, description, subscriptionTypes[], slug, owner
│   └── Consent.js          # email, bannerId, status, subscriptions[{name, enabled}]
├── middleware/auth.js       # JWT auth middleware
├── routes/
│   ├── auth.js             # Register, login, verify email, reset password
│   ├── banners.js          # Dashboard, preference center CRUD
│   └── consent.js          # Public preference center + consent flow
└── views/                  # EJS templates
    ├── register.ejs
    ├── login.ejs
    ├── reset-password.ejs
    ├── dashboard.ejs         # Lists preference centers with subscription tables
    ├── banner-form.ejs       # Create preference center with dynamic subscription inputs
    ├── banner-detail.ejs     # Detail view with subscription table + consent records
    ├── public-banner.ejs     # Public page — subscription table + email input
    └── consent-submit.ejs    # Toggle each subscription on/off + save
```

## Data Model

### Consent record

```json
{
  "email": "user@example.com",
  "bannerId": "<preference-center-id>",
  "status": "submitted",
  "subscriptions": [
    { "name": "Newsletter", "enabled": true },
    { "name": "Promotions", "enabled": false },
    { "name": "Updates", "enabled": true }
  ]
}
```
