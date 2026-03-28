# External Integrations

**Analysis Date:** 2026-03-25

## Databases

**PostgreSQL:**
- Version: PostgreSQL 15 (via `docker-compose.yml`)
- Connection: `DATABASE_URL` environment variable
- Client: Prisma ORM 6.1.0
- Schema location: `prisma/schema.prisma`
- Default dev config: `postgres://admin:admin123@localhost:5432/project_manager`

## APIs & External Services

**AI Services:**
- Provider: OpenAI-compatible API
- Config: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` environment variables
- Default model: `gpt-4o-mini`
- Database config: `ai_configs` table for dynamic provider selection
- Implementation: `src/lib/ai.ts` - `callAI()`, `analyzeRisk()`, `auditReview()`
- Logging: All AI calls logged to `ai_logs` table with duration and status
- Caching: Response caching via `ai_response_cache` table

**Email Service:**
- Provider: SMTP (nodemailer-based)
- Config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Database config: `email_configs` table for multiple configurations
- Templates: `email_templates` table for email templates
- Logging: `email_logs` table for delivery tracking
- Implementation: `src/lib/email.ts`, `src/lib/email-providers/smtp.ts`

**Document Preview Services:**

1. **OnlyOffice:**
   - Service: OnlyOffice Document Server
   - Config: `ONLYOFFICE_API_URL`, `ONLYOFFICE_API_KEY`, `ONLYOFFICE_CALLBACK_URL`
   - Default: `http://localhost:8082`
   - Docker: `docker-compose.onlyoffice.yml`
   - Implementation: `src/lib/preview/onlyoffice.ts`
   - Callback: `src/app/api/v1/files/onlyoffice-callback/route.ts`

2. **KKFileView:**
   - Config: `KKFILEVIEW_URL`
   - Default: `http://localhost:8012`
   - Implementation: `src/lib/preview/kkfileview.ts`

3. **Native Preview:**
   - Built-in document preview fallback
   - Implementation: `src/lib/preview/degradation.ts`

## Authentication & Identity

**Provider:**
- Custom JWT-based authentication
- Library: Jose 5.9.6 (`jose` package)
- Config: `JWT_SECRET` environment variable
- Implementation: `src/lib/auth.ts`
- Token storage: HTTP-only cookies

**Password Reset:**
- Token storage: `password_reset_tokens` table
- Email integration via SMTP

## Monitoring & Observability

**Audit Logging:**
- Database: `audit_logs` table
- Actions tracked: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, PERMISSION_CHANGE, etc.
- Implementation: `src/lib/` service layer integration

**AI Logging:**
- Database: `ai_logs` table
- Tracks: prompt, response, status, duration, model used
- Service types: RISK_ANALYSIS, REVIEW_AUDIT, DOC_PARSE

**Email Logging:**
- Database: `email_logs` table
- Tracks: delivery status, error messages, sent timestamps

## File Storage

**Storage Type:**
- Local filesystem storage
- File metadata stored in `file_storage` table
- Document key-based access with locking mechanism
- Implementation: `src/lib/file-permission.ts`, `src/lib/document-lock.ts`

**File Upload:**
- Upload endpoint: `src/app/api/v1/files/route.ts`
- Preview endpoint: `src/app/api/v1/files/preview/route.ts`

## Webhooks

**Outgoing Webhooks:**
- Configuration: `webhooks` table (name, url, events, secret)
- Delivery tracking: `webhook_deliveries` table
- Events: Stored as comma-separated string in database
- Implementation: `src/app/api/v1/webhooks/` routes
- Test endpoint: `/api/v1/webhooks/test`

**Incoming Webhooks:**
- OnlyOffice callback: `/api/v1/files/onlyoffice-callback`

## CI/CD & Deployment

**Hosting:**
- Docker Compose deployment (`docker-compose.yml`)
- Services: app (Next.js), postgres

**Docker Services:**
- PostgreSQL 15: Database server
- OnlyOffice Document Server: Document preview and editing
- Custom network: `docker_pm-network`

## Scheduled Jobs

**Job Scheduler:**
- Configuration: `scheduled_jobs` table
- Fields: cron expression, endpoint, method, payload
- Tracking: lastRunAt, lastStatus, lastError
- Implementation: External scheduler integration required

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 64 chars)
- `ENCRYPTION_KEY` - Encryption key for sensitive data (min 32 chars)
- `URL_SIGN_SECRET` - URL signing secret (min 32 chars)
- `NEXT_PUBLIC_APP_URL` - Application base URL
- `SMTP_*` - Email configuration (optional)
- `AI_*` - AI service configuration (optional)
- `ONLYOFFICE_*` - OnlyOffice configuration (optional)
- `KKFILEVIEW_URL` - KKFileView configuration (optional)

**Secrets Location:**
- `.env` file (development)
- Docker environment variables (production)
- Never committed to version control

---

*Integration audit: 2026-03-25*
