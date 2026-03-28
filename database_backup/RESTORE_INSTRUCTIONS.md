# Database Backup & Restore Instructions

## Files Included

- `schema.sql` - Database schema only (table structures, indexes, constraints)
- `data.sql` - Data only (INSERT statements for all rows)
- `full_backup.sql` - Complete backup (schema + data combined)
- `restore.sh` - Automated restore script

## Quick Restore (Recommended)

Use the `restore.sh` script to restore everything to a new PostgreSQL server:

```bash
chmod +x restore.sh
./restore.sh
```

The script will prompt you for your database connection details.

## Manual Restore

### Option 1: Full Restore (Schema + Data)

```bash
psql -h YOUR_HOST -p 5432 -U YOUR_USER -d YOUR_DATABASE -f full_backup.sql
```

### Option 2: Schema First, Then Data

```bash
psql -h YOUR_HOST -p 5432 -U YOUR_USER -d YOUR_DATABASE -f schema.sql
psql -h YOUR_HOST -p 5432 -U YOUR_USER -d YOUR_DATABASE -f data.sql
```

## Requirements

- PostgreSQL 16+ (backup was created from PostgreSQL 16.10)
- `psql` command-line tool installed
- A target database already created (the script creates tables, not the database itself)

## Creating a New Database

If you need to create the target database first:

```bash
createdb -h YOUR_HOST -p 5432 -U YOUR_USER YOUR_DATABASE_NAME
```

## Notes

- The backup uses `INSERT` statements (not COPY) for maximum compatibility
- Ownership and permissions are excluded so it works on any server
- The `sessions` table data is excluded as sessions are environment-specific
- Passwords in the `users` table are bcrypt-hashed
