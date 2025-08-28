#!/bin/bash

# Backend Scaling Script
# This script helps manage backend instance scaling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REPLICAS=3
MAX_REPLICAS=10
MIN_REPLICAS=1

show_help() {
    echo -e "${GREEN}Backend Scaling Script${NC}"
    echo "=========================="
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  scale-up [replicas]    Scale up backend instances (default: $DEFAULT_REPLICAS)"
    echo "  scale-down [replicas]  Scale down backend instances (default: $MIN_REPLICAS)"
    echo "  status                 Show current scaling status"
    echo "  health                 Check health of all backend instances"
    echo "  help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 scale-up 5         # Scale to 5 backend instances"
    echo "  $0 scale-down         # Scale down to 1 instance"
    echo "  $0 status             # Show current status"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed or not running.${NC}"
        exit 1
    fi
}

get_current_replicas() {
    docker ps --filter "name=errdb-backend" --format "{{.Names}}" | wc -l
}

scale_instances() {
    local desired_replicas=$1
    local action=$2
    
    if [[ $desired_replicas -lt $MIN_REPLICAS ]] || [[ $desired_replicas -gt $MAX_REPLICAS ]]; then
        echo -e "${RED}Error: Replicas must be between $MIN_REPLICAS and $MAX_REPLICAS${NC}"
        exit 1
    fi

    echo -e "${YELLOW}${action} backend instances to $desired_replicas...${NC}"
    
    # Scale using Docker Compose
    docker-compose -f docker-compose.scale.yml up -d --scale backend=$desired_replicas
    
    echo -e "${GREEN}Successfully ${action} to $desired_replicas backend instances${NC}"
}

check_health() {
    echo -e "${BLUE}Checking backend instances health...${NC}"
    
    local instances=$(docker ps --filter "name=errdb-backend" --format "{{.Names}}")
    local healthy_count=0
    local total_count=0
    
    for instance in $instances; do
        total_count=$((total_count + 1))
        if docker exec $instance curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $instance: HEALTHY${NC}"
            healthy_count=$((healthy_count + 1))
        else
            echo -e "${RED}✗ $instance: UNHEALTHY${NC}"
        fi
    done
    
    echo -e "${BLUE}Health Summary: $healthy_count/$total_count instances healthy${NC}"
    
    if [[ $healthy_count -eq $total_count ]]; then
        echo -e "${GREEN}All backend instances are healthy!${NC}"
    else
        echo -e "${YELLOW}Some instances are unhealthy. Consider restarting.${NC}"
    fi
}

show_status() {
    echo -e "${BLUE}Current Backend Scaling Status${NC}"
    echo "================================"
    
    local current_replicas=$(get_current_replicas)
    echo -e "Running instances: ${GREEN}$current_replicas${NC}"
    
    # Show resource usage
    echo -e "\n${BLUE}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -n 1
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep errdb-backend
    
    # Show load balancer status
    echo -e "\n${BLUE}Load Balancer Status:${NC}"
    if docker ps --filter "name=errdb-load-balancer" --format "{{.Names}}" | grep -q .; then
        echo -e "${GREEN}Load balancer is running${NC}"
    else
        echo -e "${YELLOW}Load balancer is not running${NC}"
    fi
}

# Main script execution
check_docker

case "${1:-help}" in
    scale-up)
        desired_replicas=${2:-$DEFAULT_REPLICAS}
        scale_instances $desired_replicas "scaled up"
        ;;
    scale-down)
        desired_replicas=${2:-$MIN_REPLICAS}
        scale_instances $desired_replicas "scaled down"
        ;;
    status)
        show_status
        ;;
    health)
        check_health
        ;;
    help|*)
        show_help
        ;;
esac