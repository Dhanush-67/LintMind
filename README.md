# LintMind

**AI-powered pull request reviews, delivered directly where developers work.**

[![CI](https://github.com/Dhanush-67/LintMind/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhanush-67/LintMind/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)](https://lintmind-qhzy.onrender.com/)

LintMind is a GitHub App that automatically reviews pull requests. It verifies incoming GitHub webhooks, retrieves the changed files, extracts reviewable lines from each patch, sends focused code changes to an LLM, validates the response, and posts contextual comments directly on the relevant lines of the pull request.

The service is deployed on Render and backed by Neon PostgreSQL. Review runs and generated comments are persisted through Prisma, while unique GitHub delivery IDs make webhook processing idempotent.

## Highlights

- Posts AI-generated feedback as inline GitHub pull request comments.
- Authenticates as a GitHub App using JWTs and short-lived installation access tokens.
- Verifies webhook authenticity with HMAC-SHA256 and constant-time signature comparison.
- Parses unified diff hunks and reviews only lines added by the pull request.
- Validates structured model output with Zod and rejects invented file or line locations.
- Prevents duplicate processing by reserving each unique GitHub delivery in PostgreSQL.
- Tracks every review as `PROCESSING`, `COMPLETED`, or `FAILED` for operational traceability.
- Runs 16 automated Vitest and Supertest tests through GitHub Actions CI.
- Deploys the Node.js service on Render with a managed Neon PostgreSQL database.

## How It Works

```mermaid
flowchart TD
    A["Pull request opened or updated"] --> B["GitHub sends a webhook"]
    B --> C["Verify signature and reserve delivery"]
    C --> D["Fetch files and parse added lines"]
    D --> E["Generate and validate AI findings"]
    E --> F["Post inline GitHub review"]
    F --> G["Persist status and comments"]
```

1. GitHub sends a `pull_request` webhook when a pull request is opened, reopened, or synchronized.
2. LintMind verifies the `X-Hub-Signature-256` header using the raw request body and the app's webhook secret.
3. The delivery ID is inserted into PostgreSQL. A uniqueness constraint causes retries of an already-seen delivery to exit safely without repeating the review.
4. LintMind exchanges its GitHub App credentials for an installation access token and retrieves every changed file with Octokit pagination.
5. The diff parser converts added patch lines into review chunks containing a filename, new-file line number, and source content.
6. GitHub Models analyzes the focused changes and returns structured JSON. Zod validates its shape, and an allowlist removes comments that reference locations outside the supplied diff.
7. Valid findings are submitted as a single GitHub pull request review, then stored with the completed review run.

If processing fails after a delivery is reserved, the corresponding review run is marked `FAILED`.

## Tech Stack

| Area               | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| Runtime            | Node.js 24, JavaScript ES modules                     |
| API                | Express 5                                             |
| GitHub integration | GitHub Apps, Octokit REST API, `@octokit/auth-app`    |
| AI review          | GitHub Models, structured JSON output, Zod validation |
| Database           | PostgreSQL on Neon                                    |
| ORM                | Prisma 7 with the PostgreSQL driver adapter           |
| Testing            | Vitest, Supertest                                     |
| CI/CD              | GitHub Actions, Render                                |

## Project Structure

```text
LintMind/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Tests pushes and pull requests to main
└── backend/
    ├── prisma/
    │   ├── migrations/               # Versioned PostgreSQL migrations
    │   └── schema.prisma             # ReviewRun and ReviewComment models
    ├── src/
    │   ├── db/prisma.js              # Prisma client and PostgreSQL adapter
    │   ├── github/
    │   │   ├── auth.js               # GitHub App installation authentication
    │   │   ├── diffParser.js         # Unified-diff line extraction
    │   │   ├── postReview.js         # Inline review submission
    │   │   └── pull.js               # Paginated changed-file retrieval
    │   ├── llm/githubModels.js        # GitHub Models API client
    │   ├── review/
    │   │   ├── aiReviewEngine.js      # Prompting and response validation
    │   │   └── saveReviewRun.js       # Review lifecycle persistence
    │   ├── app.js                     # Webhook route and orchestration
    │   └── index.js                   # HTTP server entry point
    ├── package.json
    └── prisma.config.ts
```

Test files live beside the modules they cover.

## Getting Started

### Prerequisites

- [Node.js 24](https://nodejs.org/)
- A PostgreSQL database, such as [Neon](https://neon.tech/)
- A GitHub account with permission to create and install a GitHub App
- Access to a model through GitHub Models
- A public HTTPS URL for webhook delivery when running outside production; a tunnel can expose a local server during development

### 1. Clone and install

```bash
git clone https://github.com/Dhanush-67/LintMind.git
cd LintMind/backend
npm ci
```

### 2. Configure environment variables

First, protect local secrets by adding these entries to the repository's `.gitignore`:

```gitignore
.env
*.pem
```

Create `backend/.env` with the following values:

```dotenv
PORT=3000

GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nyour_private_key\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_secret

GITHUB_MODELS_TOKEN=your_github_models_token
GITHUB_MODELS_MODEL=your_model_identifier

DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

| Variable                | Purpose                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `PORT`                  | HTTP port. Defaults to `3000` when omitted.                                                                   |
| `GITHUB_APP_ID`         | Numeric ID shown in the GitHub App settings.                                                                  |
| `GITHUB_PRIVATE_KEY`    | PEM private key generated for the GitHub App. Literal `\n` sequences are converted to line breaks at runtime. |
| `GITHUB_WEBHOOK_SECRET` | Shared secret used to authenticate webhook payloads.                                                          |
| `GITHUB_MODELS_TOKEN`   | Token used to call the GitHub Models inference endpoint.                                                      |
| `GITHUB_MODELS_MODEL`   | Model identifier sent with inference requests.                                                                |
| `DATABASE_URL`          | PostgreSQL connection string used by Prisma.                                                                  |

Never commit `.env`, private keys, access tokens, or database credentials.

### 3. Prepare the database

Generate the Prisma client and apply the committed migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

For local schema development, create a new migration with:

```bash
npx prisma migrate dev --name describe_your_change
```

### 4. Configure the GitHub App

In **GitHub → Settings → Developer settings → GitHub Apps**, create an app with:

- **Webhook URL:** `https://<your-public-host>/api/github/webhook`
- **Webhook secret:** the same value as `GITHUB_WEBHOOK_SECRET`
- **Repository permission — Pull requests:** Read and write
- **Subscribe to events:** Pull request

Then:

1. Copy the app ID into `GITHUB_APP_ID`.
2. Generate a private key and store its PEM value in `GITHUB_PRIVATE_KEY`.
3. Install the app on a test repository.
4. Ensure the webhook is active and SSL verification is enabled.

The app responds to the `opened`, `reopened`, and `synchronize` pull request actions. Other event types and pull request actions are acknowledged and ignored.

### 5. Run the service

Start the development server with automatic restarts:

```bash
npm run dev
```

Or run it as a production process:

```bash
npm start
```

Verify the health endpoint:

```bash
curl http://localhost:3000/
```

Expected response:

```text
LintMind backend is running
```

## Testing

Run all 16 tests once:

```bash
npm test
```

Run Vitest in watch mode during development:

```bash
npm run test:watch
```

The test suite covers:

- unified diff parsing, including deleted lines and multiple hunks;
- model-response parsing, Zod validation, and rejection of invented locations;
- review-run reservation, completion, failure, and duplicate delivery handling;
- webhook orchestration and HTTP behavior with external services mocked.

GitHub Actions runs the full suite on every push and pull request targeting `main`.

## Data Model

`ReviewRun` stores pull request metadata, the GitHub installation and delivery IDs, processing status, timestamps, and the number of generated comments. `githubDeliveryId` is unique, which provides database-backed idempotency across webhook retries.

`ReviewComment` stores each accepted finding's filename, line number, text, and parent review run. Comments are deleted automatically when their parent review run is deleted.

## Deployment

The production service runs at [lintmind-qhzy.onrender.com](https://lintmind-qhzy.onrender.com/), with PostgreSQL hosted on Neon.

For a Render deployment, configure:

| Setting           | Value                           |
| ----------------- | ------------------------------- |
| Root directory    | `backend`                       |
| Build command     | `npm ci && npx prisma generate` |
| Start command     | `npm start`                     |
| Health check path | `/`                             |

Add every variable from the environment table to the Render service, using the hosted Neon connection string for `DATABASE_URL`. Apply production migrations from `backend` with:

```bash
npx prisma migrate deploy
```

Finally, update the GitHub App webhook URL to:

```text
https://<your-render-service>/api/github/webhook
```

## Reliability and Security

- Webhook signatures are compared with `crypto.timingSafeEqual` only after their byte lengths match.
- Raw request bytes are used for signature verification before the JSON payload is parsed.
- Installation access tokens are short-lived and scoped to the repositories where the app is installed.
- The system prompt treats submitted code as untrusted data and requires JSON-only output.
- Zod rejects malformed or incomplete findings before they reach GitHub or PostgreSQL.
- A filename-and-line allowlist prevents model output from targeting code outside the supplied changes.
- A PostgreSQL uniqueness constraint prevents duplicate GitHub deliveries from triggering repeated reviews.
- Failures after reservation are recorded explicitly instead of leaving a review run in an ambiguous state.

## Future Improvements

- Move review execution to a background queue so webhook requests can be acknowledged immediately.
- Batch or prioritize large diffs to stay within model context and rate limits.
- Add configurable repository rules and language-specific review prompts.
- Add dashboards and observability for review latency, failures, and model usage.
- Expand integration tests against a dedicated GitHub App test repository.
