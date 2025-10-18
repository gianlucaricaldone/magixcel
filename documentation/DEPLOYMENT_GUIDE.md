# Deployment Guide

## Local Development

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- 10GB free disk space (for file uploads)

### Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Initialize database
npm run db:init

# Start development server
npm run dev
```

### Environment Variables
```bash
# .env.local
DATABASE_TYPE=sqlite
DATABASE_URL=file:./data/magixcel.db
STORAGE_PATH=./data/uploads
STORAGE_TYPE=local
MAX_UPLOAD_SIZE=1073741824
NODE_ENV=development
```

### Database Initialization
```bash
# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

---

## Production Deployment

### Vercel Deployment

#### Prerequisites
- Vercel account
- Supabase account
- Cloudflare R2 account (optional)

#### Step 1: Prepare Supabase
```bash
# Create new Supabase project
# Run migrations
psql -h <supabase-host> -U postgres -d postgres < lib/db/migrations/001_initial_schema.sql

# Get connection string
# Project Settings → Database → Connection String
```

#### Step 2: Configure Environment Variables
In Vercel dashboard:
```bash
DATABASE_TYPE=supabase
DATABASE_URL=<supabase-connection-string>
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<supabase-anon-key>
STORAGE_TYPE=cloud
R2_ACCOUNT_ID=<cloudflare-r2-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=magixcel-files
MAX_UPLOAD_SIZE=1073741824
NODE_ENV=production
```

#### Step 3: Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Step 4: Configure Custom Domain (Optional)
```bash
vercel domains add magixcel.com
```

---

### Cloudflare Pages Deployment

#### Step 1: Build Configuration
```toml
# wrangler.toml
name = "magixcel"
main = ".output/server/index.mjs"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
publish = ".output/public"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "magixcel-files"

[vars]
DATABASE_TYPE = "supabase"
STORAGE_TYPE = "cloud"
```

#### Step 2: Deploy
```bash
# Install Wrangler
npm i -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy .output/public
```

---

### Self-Hosted Deployment (Docker)

#### Dockerfile
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_TYPE=sqlite
      - DATABASE_URL=file:/data/magixcel.db
      - STORAGE_PATH=/data/uploads
      - STORAGE_TYPE=local
    volumes:
      - ./data:/data
    restart: unless-stopped

  # Optional: PostgreSQL instead of SQLite
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: magixcel
      POSTGRES_USER: magixcel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deploy
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Database Migrations

### SQLite to Supabase Migration

#### Step 1: Export Data
```bash
# Dump SQLite data to SQL
sqlite3 data/magixcel.db .dump > migration.sql
```

#### Step 2: Convert to PostgreSQL
```bash
# Install pgloader
brew install pgloader  # macOS
apt install pgloader   # Ubuntu

# Migrate
pgloader sqlite://data/magixcel.db postgresql://<supabase-connection-string>
```

#### Step 3: Verify
```bash
# Count records in SQLite
sqlite3 data/magixcel.db "SELECT COUNT(*) FROM sessions;"

# Count records in Supabase
psql -h <supabase-host> -U postgres -d postgres -c "SELECT COUNT(*) FROM sessions;"
```

#### Step 4: Update Environment
```bash
# Change DATABASE_TYPE in .env
DATABASE_TYPE=supabase
DATABASE_URL=<supabase-connection-string>
```

---

## File Storage Migration

### Local to Cloudflare R2

#### Step 1: Install Rclone
```bash
# macOS
brew install rclone

# Ubuntu
apt install rclone
```

#### Step 2: Configure R2
```bash
rclone config

# Select: n (New remote)
# Name: r2
# Type: s3
# Provider: Cloudflare
# Access Key ID: <r2-access-key>
# Secret Access Key: <r2-secret-key>
# Endpoint: https://<account-id>.r2.cloudflarestorage.com
```

#### Step 3: Sync Files
```bash
# Dry run
rclone sync --dry-run data/uploads/ r2:magixcel-files/

# Actual sync
rclone sync data/uploads/ r2:magixcel-files/ --progress
```

#### Step 4: Verify
```bash
# List files
rclone ls r2:magixcel-files/

# Compare
rclone check data/uploads/ r2:magixcel-files/
```

---

## Monitoring & Observability

### Sentry Integration
```bash
# Install
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Configure
# sentry.client.config.js
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Vercel Analytics
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Logging
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});
```

---

## Backup Strategy

### SQLite Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 data/magixcel.db ".backup data/backups/magixcel_$DATE.db"

# Keep only last 7 days
find data/backups/ -name "magixcel_*.db" -mtime +7 -delete
```

### Supabase Backups
```bash
# Manual backup
pg_dump -h <supabase-host> -U postgres -d postgres > backup.sql

# Restore
psql -h <supabase-host> -U postgres -d postgres < backup.sql
```

Supabase provides automatic daily backups with Point-in-Time Recovery (PITR).

---

## Performance Optimization

### CDN Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['<cdn-domain>'],
    loader: 'cloudflare',
  },
  assetPrefix: process.env.CDN_URL,
};
```

### Caching Headers
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}
```

---

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] File upload validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure headers (helmet.js)
- [ ] Database connection pooling
- [ ] Secrets rotation policy
- [ ] Regular dependency updates
- [ ] Security audit logs
- [ ] Incident response plan

---

## Rollback Procedure

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Database Rollback
```bash
# Restore from backup
sqlite3 data/magixcel.db < data/backups/magixcel_20240101.db

# Or for Supabase
psql -h <supabase-host> -U postgres -d postgres < backup.sql
```

---

## Troubleshooting

### Common Issues

**Issue**: File upload fails with 413 error
```bash
# Increase Next.js body size limit
# next.config.js
api: {
  bodyParser: {
    sizeLimit: '100mb',
  },
}
```

**Issue**: Database connection timeout
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Issue**: Out of memory during Excel processing
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```
