#!/bin/bash

# Migration script for development database
# This script recreates the database with the new schema

set -e

DB_PATH="./data/magixcel.db"
BACKUP_PATH="./data/magixcel.db.backup-$(date +%Y%m%d-%H%M%S)"
SCHEMA_PATH="./lib/adapters/db/schema.sqlite.sql"

echo "🔄 MagiXcel Database Migration (Development)"
echo "=============================================="
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    echo "Creating new database..."
    sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
    echo "✅ New database created successfully!"
    exit 0
fi

# Backup existing database
echo "📦 Creating backup..."
cp "$DB_PATH" "$BACKUP_PATH"
echo "✅ Backup saved to: $BACKUP_PATH"
echo ""

# Delete old database
echo "🗑️  Removing old database..."
rm "$DB_PATH"

# Create new database with updated schema
echo "🏗️  Creating new database with updated schema..."
sqlite3 "$DB_PATH" < "$SCHEMA_PATH"

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  - Old database backed up to: $BACKUP_PATH"
echo "  - New database created at: $DB_PATH"
echo "  - Schema: $SCHEMA_PATH"
echo ""
echo "⚠️  Note: All previous data has been removed (this is a development migration)"
echo "   If you need to restore data, use the backup file."
echo ""
echo "🚀 You can now start the server: npm run dev"
