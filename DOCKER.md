# Docker Deployment Guide for CardMatch

This directory contains Docker configuration files for running CardMatch in containerized environments.

## Files Overview

- `Dockerfile` - Production-ready Docker image
- `docker-compose.yml` - Simple Docker Compose setup
- `.dockerignore` - Files to exclude from Docker context
- `docker-helper.sh` - Linux/macOS helper script
- `docker-helper.bat` - Windows helper script

## Quick Start

```bash
# Build and run CardMatch
docker-compose up --build

# Run in background
docker-compose up -d --build

# Using helper scripts (recommended)
# Linux/macOS
./docker-helper.sh start-bg

# Windows
docker-helper.bat start-bg
```

## Usage Examples

### Basic Usage

```bash
# Start CardMatch
docker-compose up -d

# Check service status
docker-compose ps

# View application logs
docker-compose logs cardmatch-app

# Stop CardMatch
docker-compose down
```

### Using Helper Scripts

```bash
# Linux/macOS
./docker-helper.sh start-bg    # Start in background
./docker-helper.sh logs        # View logs
./docker-helper.sh status      # Check status
./docker-helper.sh stop        # Stop service
./docker-helper.sh shell       # Open container shell

# Windows
docker-helper.bat start-bg
docker-helper.bat logs
docker-helper.bat status
docker-helper.bat stop
docker-helper.bat shell
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Application settings
NODE_ENV=production
PORT=3000

# Docker settings
COMPOSE_PROJECT_NAME=cardmatch
```

### Port Configuration

By default, CardMatch runs on port 3000. To use a different port:

```yaml
# In docker-compose.yml
services:
  cardmatch-app:
    ports:
      - "8080:3000"  # Access on port 8080
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check if port 3000 is in use
   netstat -tulpn | grep :3000
   
   # Change port in docker-compose.yml if needed
   ports:
     - "3001:3000"  # Use port 3001 instead
   ```

2. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Container won't start**
   ```bash
   # Check logs for errors
   docker-compose logs cardmatch-app
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debugging

```bash
# Access running container
docker exec -it cardmatch-game sh

# Check container health
docker inspect cardmatch-game | grep Health -A 10

# Monitor resource usage
docker stats cardmatch-game
```

## Network Access

### Network Access

The application will be accessible on:
- `http://localhost:3000` (local access)
- `http://YOUR_MACHINE_IP:3000` (from other devices on network)

### Firewall Configuration

Ensure port `3000/tcp` is open for the CardMatch application.

## Production Considerations

### Security

1. **Use specific image versions**
   ```dockerfile
   FROM node:18.17.0-alpine  # Instead of node:18-alpine
   ```

2. **Scan for vulnerabilities**
   ```bash
   docker scan cardmatch-local-web-js_cardmatch-app
   ```

3. **Update base images regularly**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Performance

1. **Resource limits**
   ```yaml
   services:
     cardmatch-app:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

2. **Health checks**
   - Configured in Dockerfile
   - Monitors application availability
   - Automatic restart on failure

### Monitoring

```bash
# View resource usage
docker stats

# Monitor logs
docker-compose logs -f --tail=100

# Export metrics (if monitoring tools available)
docker inspect cardmatch-game
```

## Backup and Recovery

### Data Backup

```bash
# No persistent data in default setup
# If logs are important:
docker cp cardmatch-game:/app/logs ./backup-logs
```

### Container Recovery

```bash
# Restart failed containers
docker-compose restart

# Full rebuild and restart
docker-compose down
docker-compose up --build -d
```