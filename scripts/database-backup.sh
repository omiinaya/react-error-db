#!/bin/bash

# Database Backup and Recovery Script
# Comprehensive backup management for PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=30
COMPRESSION=true
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

# Load environment variables
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

show_help() {
    echo -e "${GREEN}Database Backup and Recovery Script${NC}"
    echo "=========================================="
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  create          Create a new database backup"
    echo "  restore [file]  Restore database from backup file"
    echo "  list            List available backups"
    echo "  cleanup         Clean up old backups"
    echo "  schedule        Set up automated backup schedule"
    echo "  status          Show backup status and disk usage"
    echo "  verify [file]   Verify backup file integrity"
    echo "  help            Show this help message"
    echo ""
    echo "Options:"
    echo "  --dir <path>    Backup directory (default: $BACKUP_DIR)"
    echo "  --retention <n> Retention days (default: $RETENTION_DAYS)"
    echo "  --no-compress   Disable compression"
    echo ""
    echo "Examples:"
    echo "  $0 create"
    echo "  $0 restore backup_20231201_120000.sql.gz"
    echo "  $0 list"
    echo "  $0 cleanup --retention 7"
}

check_dependencies() {
    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}Error: pg_dump is not installed. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}Error: psql is not installed. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
}

parse_database_url() {
    local db_url=$DATABASE_URL
    
    if [ -z "$db_url" ]; then
        echo -e "${RED}Error: DATABASE_URL environment variable is required${NC}"
        exit 1
    fi
    
    # Parse PostgreSQL connection string
    if [[ $db_url =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
        exit 1
    fi
}

create_backup() {
    echo -e "${BLUE}Creating database backup...${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Set PostgreSQL password
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup with compression
    if [ "$COMPRESSION" = true ]; then
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --format=plain --no-owner --no-acl --clean --if-exists | \
            gzip > "$BACKUP_DIR/$BACKUP_FILE"
    else
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --format=plain --no-owner --no-acl --clean --if-exists > \
            "$BACKUP_DIR/${BACKUP_FILE%.gz}"
    fi
    
    # Verify backup was created
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ] || [ -f "$BACKUP_DIR/${BACKUP_FILE%.gz}" ]; then
        echo -e "${GREEN}✅ Backup created successfully${NC}"
        echo -e "Backup file: $BACKUP_DIR/$BACKUP_FILE"
        
        # Calculate backup size
        local backup_size
        if [ "$COMPRESSION" = true ]; then
            backup_size=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
        else
            backup_size=$(du -h "$BACKUP_DIR/${BACKUP_FILE%.gz}" | cut -f1)
        fi
        echo -e "Backup size: $backup_size"
    else
        echo -e "${RED}❌ Backup creation failed${NC}"
        exit 1
    fi
}

restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}Error: Backup file parameter is required${NC}"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ $confirm != [yY] ]]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    echo -e "${BLUE}Restoring database from backup...${NC}"
    
    # Set PostgreSQL password
    export PGPASSWORD="$DB_PASSWORD"
    
    # Restore from compressed or uncompressed backup
    if [[ $backup_file == *.gz ]]; then
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file"
    fi
    
    echo -e "${GREEN}✅ Database restored successfully${NC}"
}

list_backups() {
    echo -e "${BLUE}Available backups:${NC}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "No backup directory found"
        return
    fi
    
    local backups=($(ls -1t "$BACKUP_DIR"/*.sql* 2>/dev/null || true))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "No backups found"
        return
    fi
    
    for backup in "${backups[@]}"; do
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" | cut -d' ' -f1)
        echo "• $backup ($size, $date)"
    done
}

cleanup_backups() {
    echo -e "${BLUE}Cleaning up old backups...${NC}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "No backup directory found"
        return
    fi
    
    local old_backups=($(find "$BACKUP_DIR" -name "*.sql*" -mtime +$RETENTION_DAYS))
    
    if [ ${#old_backups[@]} -eq 0 ]; then
        echo "No old backups to clean up"
        return
    fi
    
    for backup in "${old_backups[@]}"; do
        echo "Removing: $backup"
        rm -f "$backup"
    done
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

setup_schedule() {
    echo -e "${BLUE}Setting up automated backup schedule...${NC}"
    
    # Create cron job for daily backups at 2 AM
    local cron_job="0 2 * * * cd $(pwd) && ./scripts/database-backup.sh create >> ./backups/backup.log 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null | grep -v "database-backup.sh"; echo "$cron_job") | crontab -
    
    echo -e "${GREEN}✅ Backup schedule configured${NC}"
    echo "Backups will run daily at 2:00 AM"
    echo "Logs will be saved to: ./backups/backup.log"
}

show_status() {
    echo -e "${BLUE}Backup Status${NC}"
    echo "============="
    
    # Backup directory info
    if [ -d "$BACKUP_DIR" ]; then
        local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        local file_count=$(find "$BACKUP_DIR" -name "*.sql*" | wc -l)
        echo "Backup directory: $BACKUP_DIR"
        echo "Total size: $total_size"
        echo "Number of backups: $file_count"
    else
        echo "Backup directory: Not created"
    fi
    
    # Disk space
    echo -e "\nDisk space:"
    df -h . | tail -1
    
    # Next scheduled backup (if cron exists)
    local next_run=$(crontab -l 2>/dev/null | grep "database-backup.sh" | head -1)
    if [ -n "$next_run" ]; then
        echo -e "\nScheduled backup: Enabled"
        echo "Next run: Daily at 2:00 AM"
    else
        echo -e "\nScheduled backup: Not configured"
    fi
}

verify_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}Error: Backup file parameter is required${NC}"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Verifying backup file: $backup_file${NC}"
    
    # Check if file is valid
    if [[ $backup_file == *.gz ]]; then
        if gzip -t "$backup_file"; then
            echo -e "${GREEN}✅ Backup file is valid and not corrupted${NC}"
        else
            echo -e "${RED}❌ Backup file is corrupted${NC}"
            exit 1
        fi
    else
        # Basic check for SQL files
        if head -n 1 "$backup_file" | grep -q "PostgreSQL database dump"; then
            echo -e "${GREEN}✅ Backup file appears to be valid${NC}"
        else
            echo -e "${YELLOW}⚠️  Backup file format may be invalid${NC}"
        fi
    fi
    
    # Show file info
    local size=$(du -h "$backup_file" | cut -f1)
    local date=$(stat -c %y "$backup_file" | cut -d' ' -f1)
    echo "File size: $size"
    echo "Modified: $date"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --no-compress)
            COMPRESSION=false
            shift
            ;;
        *)
            break
            ;;
    esac
done

# Main script execution
check_dependencies
parse_database_url

case "${1:-help}" in
    create)
        create_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_backups
        ;;
    schedule)
        setup_schedule
        ;;
    status)
        show_status
        ;;
    verify)
        verify_backup "$2"
        ;;
    help|*)
        show_help
        ;;
esac