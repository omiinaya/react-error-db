#!/bin/bash

# Database Backup Monitoring Script
# Monitors backup status and sends alerts

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
ALERT_EMAIL="admin@your-domain.com"
MIN_BACKUP_COUNT=1
MAX_BACKUP_AGE_DAYS=2

# Load environment variables
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

show_help() {
    echo -e "${GREEN}Database Backup Monitoring Script${NC}"
    echo "========================================"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check         Check backup status and send alerts"
    echo "  report        Generate backup status report"
    echo "  test-alert    Test alert notification system"
    echo "  help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ALERT_EMAIL          Email for notifications"
    echo "  SMTP_HOST            SMTP server host"
    echo "  SMTP_PORT            SMTP server port"
    echo "  SMTP_USER            SMTP username"
    echo "  SMTP_PASS            SMTP password"
}

send_alert() {
    local subject=$1
    local message=$2
    local severity=$3
    
    echo -e "${RED}ALERT: $subject${NC}"
    echo "$message"
    
    # Email alert (if SMTP configured)
    if [ -n "$SMTP_HOST" ] && [ -n "$ALERT_EMAIL" ]; then
        send_email_alert "$subject" "$message" "$severity"
    fi
    
    # TODO: Add other alert methods (Slack, SMS, etc.)
}

send_email_alert() {
    local subject=$1
    local message=$2
    local severity=$3
    
    # Simple email using mail command or curl to SMTP
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "[$severity] $subject" "$ALERT_EMAIL"
    elif command -v curl &> /dev/null && [ -n "$SMTP_HOST" ]; then
        # This is a simplified example - use proper email service in production
        echo "Email alert would be sent to: $ALERT_EMAIL"
        echo "Subject: [$severity] $subject"
        echo "Message: $message"
    fi
}

check_backup_status() {
    echo -e "${BLUE}Checking backup status...${NC}"
    
    local issues=()
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        issues+=("Backup directory does not exist: $BACKUP_DIR")
    else
        # Check number of backups
        local backup_count=$(find "$BACKUP_DIR" -name "*.sql*" | wc -l)
        if [ "$backup_count" -lt "$MIN_BACKUP_COUNT" ]; then
            issues+=("Insufficient backups: $backup_count found (minimum: $MIN_BACKUP_COUNT)")
        fi
        
        # Check backup age
        local latest_backup=$(find "$BACKUP_DIR" -name "*.sql*" -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
        if [ -n "$latest_backup" ]; then
            local backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 86400 ))
            if [ "$backup_age" -gt "$MAX_BACKUP_AGE_DAYS" ]; then
                issues+=("Latest backup is $backup_age days old (maximum: $MAX_BACKUP_AGE_DAYS days)")
            fi
        else
            issues+=("No backup files found")
        fi
        
        # Check backup sizes (ensure they're not empty)
        local empty_backups=($(find "$BACKUP_DIR" -name "*.sql*" -size 0))
        if [ ${#empty_backups[@]} -gt 0 ]; then
            issues+=("Found ${#empty_backups[@]} empty backup files")
        fi
    fi
    
    # Check disk space
    local disk_usage=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        issues+=("Disk usage is high: $disk_usage%")
    fi
    
    # Report status
    if [ ${#issues[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All backup checks passed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Backup issues detected:${NC}"
        for issue in "${issues[@]}"; do
            echo "  • $issue"
        done
        
        # Send alert for critical issues
        if [ ${#issues[@]} -gt 0 ]; then
            local alert_subject="Database Backup Issues Detected"
            local alert_message="Backup monitoring detected the following issues:\n\n"
            for issue in "${issues[@]}"; do
                alert_message+="• $issue\n"
            done
            alert_message+="\nPlease investigate immediately."
            
            send_alert "$alert_subject" "$alert_message" "CRITICAL"
        fi
        
        return 1
    fi
}

generate_report() {
    echo -e "${BLUE}Generating backup status report...${NC}"
    
    echo "Backup Status Report"
    echo "===================="
    echo "Generated: $(date)"
    echo ""
    
    # Backup directory info
    if [ -d "$BACKUP_DIR" ]; then
        echo "Backup Directory: $BACKUP_DIR"
        echo "Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
        
        # List backups with details
        echo ""
        echo "Backup Files:"
        echo "------------"
        local backups=($(find "$BACKUP_DIR" -name "*.sql*" -printf '%T@ %p\n' | sort -n | cut -f2- -d" "))
        
        if [ ${#backups[@]} -eq 0 ]; then
            echo "No backup files found"
        else
            printf "%-40s %-10s %-20s %-10s\n" "Filename" "Size" "Modified" "Age (days)"
            printf "%-40s %-10s %-20s %-10s\n" "--------" "----" "--------" "---------"
            
            for backup in "${backups[@]}"; do
                local size=$(du -h "$backup" | cut -f1)
                local modified=$(stat -c %y "$backup" | cut -d' ' -f1)
                local age=$(( ($(date +%s) - $(stat -c %Y "$backup")) / 86400 ))
                local filename=$(basename "$backup")
                
                printf "%-40s %-10s %-20s %-10s\n" "$filename" "$size" "$modified" "$age"
            done
        fi
    else
        echo "Backup directory not found: $BACKUP_DIR"
    fi
    
    # Disk space
    echo ""
    echo "Disk Space:"
    echo "----------"
    df -h .
    
    # Retention policy
    echo ""
    echo "Retention Policy:"
    echo "----------------"
    echo "Retention days: $RETENTION_DAYS"
    echo "Minimum backups: $MIN_BACKUP_COUNT"
    echo "Maximum backup age: $MAX_BACKUP_AGE_DAYS days"
    
    # Check for old backups to cleanup
    echo ""
    echo "Cleanup Candidates:"
    echo "------------------"
    local old_backups=($(find "$BACKUP_DIR" -name "*.sql*" -mtime +$RETENTION_DAYS 2>/dev/null || true))
    if [ ${#old_backups[@]} -eq 0 ]; then
        echo "No backups eligible for cleanup"
    else
        for backup in "${old_backups[@]}"; do
            echo "• $backup ($(du -h "$backup" | cut -f1))"
        done
    fi
}

test_alert() {
    echo -e "${BLUE}Testing alert system...${NC}"
    
    local test_subject="Test Backup Alert"
    local test_message="This is a test alert from the backup monitoring system.\n\nGenerated at: $(date)"
    
    send_alert "$test_subject" "$test_message" "TEST"
    
    echo -e "${GREEN}✅ Test alert sent${NC}"
}

# Main script execution
case "${1:-check}" in
    check)
        check_backup_status
        ;;
    report)
        generate_report
        ;;
    test-alert)
        test_alert
        ;;
    help|*)
        show_help
        ;;
esac