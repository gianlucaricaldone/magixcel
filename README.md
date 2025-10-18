# MagiXcel

Smart Excel & CSV analysis tool for filtering, analyzing, and exporting your data with ease.

## Features

- **File Upload**: Support for Excel (.xlsx, .xls) and CSV files up to 1GB
- **Smart Processing**: Automatic type inference and data validation
- **Powerful Filtering**: Apply complex filters with an intuitive interface
- **Fast Performance**: Virtual scrolling and optimized data handling
- **Export Options**: Export filtered results to CSV or JSON
- **Database Agnostic**: SQLite for development, ready for Supabase migration

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, shadcn/ui
- **State Management**: Zustand
- **Data Processing**: XLSX, PapaParse
- **Database**: SQLite (better-sqlite3)
- **Type Safety**: TypeScript strict mode

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd magixcel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

The default configuration in `.env.local` should work for local development:
```
DATABASE_TYPE=sqlite
DATABASE_URL=file:./data/magixcel.db
STORAGE_TYPE=local
STORAGE_PATH=./data/uploads
MAX_UPLOAD_SIZE=1073741824
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
magixcel/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── dashboard/            # Dashboard pages
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── upload/               # File upload components
│   ├── table/                # Data table components
│   └── filters/              # Filter components
├── lib/                      # Business logic
│   ├── db/                   # Database abstraction
│   ├── processing/           # File processing
│   ├── storage/              # File storage
│   └── utils/                # Utilities
├── stores/                   # Zustand stores
├── types/                    # TypeScript types
├── documentation/            # Project documentation
└── data/                     # Local data (git-ignored)
```

## Usage

### Uploading a File

1. Navigate to the home page
2. Drag & drop or click to browse for an Excel or CSV file
3. Wait for the file to be processed
4. You'll be redirected to the dashboard

### Filtering Data

1. In the dashboard, click "Add Filter"
2. Select a column, operator, and value
3. Add multiple filters if needed
4. Choose AND/OR combinator for multiple filters
5. Click "Apply Filters"

### Exporting Data

1. Apply your desired filters (or use the full dataset)
2. Click "Export" (coming soon)
3. Choose your format (CSV or JSON)
4. Download the file

## Development

### Database

The database schema is automatically created when you first run the application. The SQLite database file is stored at `./data/magixcel.db`.

To reset the database:
```bash
rm -rf data/
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Documentation

Detailed documentation is available in the `/documentation` folder:

- [PROJECT_OVERVIEW.md](./documentation/PROJECT_OVERVIEW.md) - Project vision and goals
- [ARCHITECTURE.md](./documentation/ARCHITECTURE.md) - Architecture decisions
- [DATABASE_SCHEMA.md](./documentation/DATABASE_SCHEMA.md) - Database schema
- [API_ENDPOINTS.md](./documentation/API_ENDPOINTS.md) - API documentation
- [NAMING_CONVENTIONS.md](./documentation/NAMING_CONVENTIONS.md) - Code conventions
- [FEATURE_ROADMAP.md](./documentation/FEATURE_ROADMAP.md) - Feature roadmap
- [DEPLOYMENT_GUIDE.md](./documentation/DEPLOYMENT_GUIDE.md) - Deployment guide

## Roadmap

### Phase 1 (MVP) - ✓ Complete
- [x] File upload (Excel/CSV)
- [x] Data preview
- [x] Basic filtering
- [x] Export to CSV/JSON
- [x] SQLite database

### Phase 2 - In Progress
- [ ] Natural language filtering
- [ ] Advanced filter operators
- [ ] Filter presets
- [ ] Save and load filters

### Phase 3 - Planned
- [ ] Pattern recognition
- [ ] Data quality analysis
- [ ] Charts and visualizations
- [ ] Advanced exports (XLSX with formatting)

See [FEATURE_ROADMAP.md](./documentation/FEATURE_ROADMAP.md) for the complete roadmap.

## Contributing

Contributions are welcome! Please read the documentation for coding conventions and architecture guidelines.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js 14
