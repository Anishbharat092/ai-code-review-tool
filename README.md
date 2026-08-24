# 🛡️ AI Code Reviewer

An enterprise-grade, distributed automated code review platform that inspects GitHub pull requests, performs line-accurate Abstract Syntax Tree (AST) validation, flags security vulnerabilities (OWASP/CWE), and suggests production-ready code fixes without synthetic line hallucinations.

---

## ⚡ Key Capabilities

- **Deterministic Line-Anchored Diffs:** Validates added and modified line numbers against raw unified diff chunks before prompting the LLM, eliminating hallucinated line comments.
- **Resilient Distributed Pipeline:** NestJS backend powered by **BullMQ** and **Redis** for concurrent, non-blocking diff review jobs.
- **Automated Model Failover:** Self-healing LLM pipeline utilizing Google Gemini models with automatic fallback and exponential backoff retry for high-demand capacity spikes.
- **Local Pre-Flight Secret Scanner:** Scans diffs locally with high-entropy regex pattern matching for exposed API keys, private certificates, and credentials before transmitting chunks to external endpoints.
- **Interactive 3D Glassmorphic HUD:** Built with Next.js 15, Three.js / React Three Fiber, and Framer Motion sticky-track storytelling.
- **Zero-Leak Token Encryption:** GitHub OAuth access tokens encrypted at rest via AES-256-GCM.

---

## 🏗️ Architecture & Directory Layout

```text
├── frontend/                     # Next.js 15 App Router + Tailwind + R3F + Zustand
│   ├── app/                      # Landing, Dashboard, and Review dynamic routes
│   │   ├── (auth)/               # Login & signup flows
│   │   ├── (dashboard)/          # Authenticated review workspace
│   │   └── page.tsx              # Interactive 3D landing page
│   ├── components/               # 3D WebGL Canvas, AST Scanner HUD, UI primitives
│   ├── lib/services/             # Axios API clients & session handlers
│   └── stores/                   # Persisted Zustand authentication store
│
└── backend/                      # NestJS Distributed Microservice
    ├── src/auth/                 # GitHub OAuth, JWT access guards & AES-256-GCM vault
    ├── src/github/               # Octokit diff fetching & payload chunker
    ├── src/reviews/              # BullMQ queue processors, controllers & Redis cache
    └── src/reviews/services/     # Gemini API AST review engine & diff parser
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js v20+
- Redis server (running locally or cloud instance)
- MongoDB instance (local or MongoDB Atlas)
- Google AI Studio API Key
- GitHub OAuth App credentials (`Client ID` & `Client Secret`)

---

### 2. Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
npm install
```

2. Create your `.env` configuration file:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key
ENCRYPTION_KEY=64_character_hex_key_for_aes_256_gcm
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
FRONTEND_URL=http://localhost:3001
```

> ⚠️ **Critical Crypto Requirement:** The `ENCRYPTION_KEY` parameter requires exactly a **256-bit key** for secure AES-256-GCM processing. In hex representation, your variable value must be a string containing exactly **64 hex characters** (32 raw bytes). If a simple 32-character plaintext string is used, Node's `crypto` module will throw an invalid key length exception and crash your worker pipelines.

#### 🔑 Cryptographic Security Generation Scripts

To quickly generate pristine environment variables locally on your development system, run these node execution statements inside your terminal:

- **Generate standard `JWT_SECRET` string:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Generate compliant `ENCRYPTION_KEY` string (64 Hex chars/32 bytes):**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

3. Start the NestJS backend in development mode:

```bash
npm run start:dev
```

---

### 3. Frontend Setup

1. Open a new terminal tab and navigate to the frontend directory:

```bash
cd frontend
npm install
```

2. Create your `.env.local` configuration file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Launch the Next.js development server on port 3001:

```bash
npm run dev -- -p 3001
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🐳 Docker Composition (Alternative Local Infrastructure)

If you have **Docker** configured on your local workstation workspace, you can spin up the required database and caching engines simultaneously without manual, local service installations:

```bash
# Initialize MongoDB and Redis service networks in background detached mode
docker run -d --name reviewer-mongo -p 27017:27017 mongo:latest
docker run -d --name reviewer-redis -p 6379:6379 redis:alpine
```

---

## 🔒 Security Standards & Compliance

- **CWE / SANS Top 25:** Proactively detects insecure token decoding, unvalidated signature guards, injection vectors, and missing auth boundaries.
- **NIST SP 800-38D:** Authenticated token encryption with AES-256-GCM using unique per-token initialization vectors.
- **TTL-Gated Redis Invalidation:** Cache keys automatically expire and invalidate when reviews complete or fail.
- **Zero Code Retention:** Transient diff chunks are evaluated in-memory and never persisted to external AI training pipelines.

---

## 🧪 Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Three.js, React Three Fiber, Framer Motion, Zustand (Persist Middleware), Lucide React.
- **Backend:** NestJS, TypeScript, BullMQ, Redis, MongoDB / Mongoose, Octokit (GitHub API), Google GenAI SDK.
