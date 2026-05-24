# MailFlow Backend

Event-driven email automation backend powering MailFlow.

MailFlow allows businesses to automate emails using reusable templates, triggers, events, and dynamic variables.

Example:

When a user signs up (`user.created`) → send a Welcome Email automatically.

---

## What is MailFlow?

MailFlow is an event-driven email automation platform.

Instead of hardcoding email logic into applications, MailFlow allows teams to define:

- **Templates** → reusable email content
- **Events** → something that happened in the system
- **Triggers** → rules deciding when emails should send
- **Conditions** → optional filters before sending

Example flow:

```txt
User Signup
    ↓
Event Created (user.created)
    ↓
Trigger Matched
    ↓
Template Selected
    ↓
Variables Rendered
    ↓
Email Sent
```

---

## How It Works

MailFlow follows an event-driven architecture.

Example:

A new user signs up.

Backend creates an event:

```json
{
  "eventType": "user.created",
  "payload": {
    "user": {
      "name": "Jay",
      "email": "jay@gmail.com"
    }
  }
}
```

MailFlow then:

1. Stores the event
2. Starts workflow processing using Inngest
3. Finds matching triggers
4. Evaluates conditions
5. Selects the linked template
6. Replaces dynamic variables (`{{user.name}}`)
7. Sends email via Resend
8. Writes logs/history

---

## Core Concepts

### Templates

Reusable email content.

Example:

```html
Subject:
Welcome {{user.name}}

Body:
<p>Hello {{user.name}}, welcome to MailFlow!</p>
```

---

### Events

Something that happened in the system.

Examples:

```txt
user.created
user.updated
user.login
email.bounced
send_history.opened
```

---

### Triggers

Rules connecting:

```txt
Event → Template
```

Example:

```txt
Event:
user.created

Template:
Welcome Email

Recipient:
user.email
```

Meaning:

```txt
When user.created happens
→ send Welcome Email
```

---

### Conditions

Optional filters.

Example:

```txt
Send only if:
user.email contains @gmail.com
```

---

## Architecture

```txt
Frontend (Next.js)
        ↓
Express API
        ↓
PostgreSQL (Prisma)
        ↓
Inngest Workflow Engine
        ↓
Trigger Engine
        ↓
Template Renderer
        ↓
Resend Email Provider
```

---

## Event Processing Flow

```txt
POST /events
      ↓
Store Event in Database
      ↓
inngest.send()
      ↓
Workflow Starts
      ↓
Find Matching Triggers
      ↓
Evaluate Conditions
      ↓
Create Email Job
      ↓
Render Template Variables
      ↓
Send Email (Resend)
      ↓
Write Logs / History
```

---

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Inngest
- Resend
- Zod
- Supabase Authentication
- Docker
- GCP Cloud Run
- GitHub Actions

---

## Project Structure

```txt
src/
├── config/             # App configuration
├── modules/            # Feature modules
│   ├── auth/
│   ├── templates/
│   ├── triggers/
│   ├── events/
│   └── send-history/
├── inngest/            # Workflow functions
├── middlewares/        # Auth / validation
├── services/           # Shared services
├── utils/              # Helpers
├── lib/                # Prisma / logger
└── routes/             # API routes
```

---

## API Base URL

Production API:

https://email-automation-api-569786805521.us-central1.run.app/api

---

## Local Development

### 1. Clone Repository

```bash
git clone <repo-url>
cd MailFlow-be
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create:

```txt
.env
```

Example:

```env
DATABASE_URL="postgresql://postgres.username:[passsword]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.username:passsword@db.bvgcrhbhwymisxptfllm.supabase.co:5432/postgres"

NODE_ENV=development
PORT=8000


SUPABASE_URL=https://
SUPABASE_SERVICE_ROLE_KEY=eyyxxxxx


RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@finovian.com


INNGEST_DEV=true
INNGEST_BASE_URL=http://localhost:8288


INNGEST_EVENT_KEY=zFCSxxxxxxxxxxxxxxxxxxxxxxxxxxx
INNGEST_SIGNING_KEY=signkey-prod-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx




```

---

### 4. Run Database Migration

```bash
npx prisma migrate dev
```

---

### 5. Generate Prisma Client

```bash
npx prisma generate
```

---

### 6. Start Inngest Dev Server

```bash
npx inngest-cli@latest dev -u http://localhost:8000/api/inngest
```

---

### 7. Start Backend

```bash
npm run dev
```

Server runs on:

```txt
http://localhost:8000
```

---

## Deployment

Backend is deployed on:

GCP Cloud Run

Deployment pipeline:

```txt
GitHub Push
      ↓
GitHub Actions
      ↓
Docker Build
      ↓
Push Container Image
      ↓
Deploy to Cloud Run
```

Production API:

https://email-automation-api-569786805521.us-central1.run.app/api

---

## Frontend

Production frontend:

https://automation.wealthifyx.com/

---

## License

Private Project
