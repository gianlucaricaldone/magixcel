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
- **Frontend**: Next.js 14, TanStack Table, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js Workers
- **Database**: SQLite (dev) → Supabase (prod)
- **Processing**: XLSX, PapaParse, future WASM
- **State**: Zustand
- **Storage**: Local FS → Cloudflare R2

## Target Users
- **Primary**: Analisti bancari/finanziari
- **Secondary**: E-commerce, HR, Marketing

## Key Differentiators
- **Performance First**: Virtual scrolling, lazy loading, WASM processing
- **User-Friendly**: Natural language filtering, no SQL required
- **Scalable Architecture**: Database-agnostic design for easy migration
- **Sector-Specific**: Pre-built templates for common use cases

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

## Performance Goals
- Handle files up to 1GB
- Initial render < 2 seconds
- Smooth scrolling for 100k+ rows
- Filter results < 500ms

## Security Considerations
- File validation and sanitization
- Session-based isolation
- No permanent storage without consent
- Data encryption at rest and in transit
