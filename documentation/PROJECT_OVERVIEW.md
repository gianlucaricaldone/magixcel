# MagiXcel - Project Overview

## Vision
Tool web-based per democratizzare l'analisi dati Excel/CSV per utenti non tecnici, con focus iniziale sul settore bancario/finanziario.

## Core Features
- Upload e processing di file Excel/CSV fino a 1GB
- Filtraggio in linguaggio naturale
- Pattern recognition automatico
- Export multipli formati
- Template predefiniti per settore
- Collaborative filtering (futuro)

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TanStack Table, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js 20+
- **Database**: SQLite (dev) → Supabase PostgreSQL (prod)
- **Analytics Engine**: DuckDB 0.9.x (columnar analytics, sub-100ms queries)
- **File Format**: Parquet (60-70% compression, columnar storage)
- **Processing**: DuckDB native readers (Excel/CSV → Parquet)
- **State**: Zustand
- **Storage**: Local FS (dev) → Cloudflare R2 (prod)
- **Cache**: In-memory (dev) → Vercel KV Redis (prod)
- **Charts**: Recharts 2.x

## Target Users
- **Primary**: Analisti bancari/finanziari
- **Secondary**: E-commerce, HR, Marketing

## Key Differentiators
- **Performance First**: DuckDB-powered queries (<100ms), Parquet columnar format, virtual scrolling
- **User-Friendly**: Visual filter builder, no SQL required, workspace organization
- **Scalable Architecture**: Adapter pattern for dev/prod, handles 1GB+ files seamlessly
- **Advanced Analytics**: Multi-view filtering, cross-sheet analysis, AI-powered insights
- **Modern Stack**: DuckDB analytics engine, Parquet storage, R2 cloud storage

## Development Phases

### Phase 1 (MVP) - Current
- File upload (Excel/CSV)
- Basic table visualization with TanStack Table
- Simple filtering capabilities
- CSV export

### Phase 2
- Natural language filtering
- Pattern recognition
- Advanced export formats
- Filter presets and templates

### Phase 3
- Collaborative features
- Cloud storage integration
- Real-time updates
- API access

## Performance Goals (Achieved)
- ✅ Handle files up to 1GB (DuckDB + Parquet)
- ✅ Upload 100k rows in ~3 seconds (includes Parquet conversion)
- ✅ Load data in <100ms (DuckDB query on Parquet)
- ✅ Filter queries in <100ms (even on 1M rows)
- ✅ Export 100k rows in <500ms
- ✅ Storage reduction: 70% (Parquet vs JSON)

## Security Considerations
- File validation and sanitization
- Session-based isolation
- No permanent storage without consent
- Data encryption at rest and in transit
