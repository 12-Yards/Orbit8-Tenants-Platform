#!/bin/bash

echo "================================================"
echo "  Golf Junkies - Database Restore Script"
echo "================================================"
echo ""

read -p "Database Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database User [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Database Name: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo "Error: Database name is required."
    exit 1
fi

read -sp "Database Password: " DB_PASS
echo ""

export PGPASSWORD="$DB_PASS"

echo ""
echo "Testing connection..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Could not connect to the database. Please check your credentials."
    echo "Make sure the database '$DB_NAME' exists. Create it with:"
    echo "  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME"
    exit 1
fi

echo "Connection successful."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Choose restore option:"
echo "  1) Full restore (schema + data) - recommended for new databases"
echo "  2) Schema only (no data)"
echo "  3) Data only (schema must already exist)"
echo ""
read -p "Option [1]: " OPTION
OPTION=${OPTION:-1}

case $OPTION in
    1)
        echo ""
        echo "Restoring full backup (schema + data)..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/full_backup.sql" 2>&1
        ;;
    2)
        echo ""
        echo "Restoring schema only..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/schema.sql" 2>&1
        ;;
    3)
        echo ""
        echo "Restoring data only..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/data.sql" 2>&1
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "  Restore completed successfully!"
    echo "================================================"
    echo ""
    echo "Connection string for your app:"
    echo "  DATABASE_URL=postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
else
    echo ""
    echo "There were some errors during restore. Check the output above."
fi

unset PGPASSWORD
