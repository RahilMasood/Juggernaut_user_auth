# 🐳 Docker Setup Guide for Audit Software API

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

### Option 1: Development Mode (Recommended for Development)

This setup includes hot-reload and development tools.

```bash
# 1. Start all services (API + PostgreSQL)
docker-compose up

# Or run in background
docker-compose up -d

# 2. View logs
docker-compose logs -f api

# 3. Run migrations (in a new terminal)
docker-compose exec api npm run migrate

# 4. Create admin user
docker-compose exec api npm run seed-admin

# 5. Access the API
curl http://localhost:3000/health
```

The API will be available at `http://localhost:3000`

### Option 2: Production Mode

```bash
# 1. Create production .env file
cp .env.docker.example .env

# 2. Edit .env and set secure values
nano .env

# 3. Start with production compose file
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec api npm run migrate

# 5. Create admin user
docker-compose -f docker-compose.prod.yml exec api npm run seed-admin
```

## Docker Commands Cheat Sheet

### Starting & Stopping

```bash
# Start all services
docker-compose up

# Start in background (detached)
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database!)
docker-compose down -v

# Restart services
docker-compose restart

# Restart only API
docker-compose restart api
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# View database logs
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 api
```

### Running Commands Inside Containers

```bash
# Run migrations
docker-compose exec api npm run migrate

# Create admin user
docker-compose exec api npm run seed-admin

# Access Node.js shell
docker-compose exec api node

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d audit_software

# Run any npm script
docker-compose exec api npm run <script-name>
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d audit_software

# Backup database
docker-compose exec postgres pg_dump -U postgres audit_software > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres audit_software < backup.sql

# View database size
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('audit_software'));"
```

### Rebuilding

```bash
# Rebuild images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose build api
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove all containers, networks, volumes
docker-compose down -v

# Clean up Docker system
docker system prune -a
```

## Development Workflow

### 1. Initial Setup

```bash
# Clone/navigate to project
cd vertiapi

# Start services
docker-compose up -d

# Wait for database to be ready (check logs)
docker-compose logs -f postgres

# Run migrations
docker-compose exec api npm run migrate

# Create admin user
docker-compose exec api npm run seed-admin
```

### 2. Daily Development

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Code changes are automatically reloaded (nodemon)
# Edit files in your IDE as normal

# Stop when done
docker-compose down
```

### 3. Testing Changes

```bash
# Run tests
docker-compose exec api npm test

# Access API
curl http://localhost:3000/health

# Check database
docker-compose exec postgres psql -U postgres -d audit_software -c "SELECT * FROM users;"
```

## Environment Variables

### Development (docker-compose.yml)
- Pre-configured with development defaults
- Database credentials: postgres/postgres
- Weak secrets (DO NOT use in production)

### Production (docker-compose.prod.yml)
- Reads from `.env` file
- Requires secure secrets
- Use `.env.docker.example` as template

## Volumes

### Development
- `postgres_data` - Database data (persisted)
- `.:/usr/src/app` - Source code (live sync)
- `./logs` - Application logs

### Production
- `postgres_data` - Database data (persisted)
- `./logs` - Application logs (only)

## Networking

- **Development**: Services communicate via Docker network
- **API Port**: 3000 (mapped to host)
- **Database Port**: 5432 (mapped to host)
- **Internal DNS**: Services can reach each other by name (e.g., `postgres`)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Map to different host port
```

### Database Connection Failed

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### API Not Starting

```bash
# Check logs
docker-compose logs api

# Rebuild image
docker-compose build api
docker-compose up -d api

# Check if database is ready
docker-compose exec postgres pg_isready
```

### Permission Issues

```bash
# Fix logs directory permissions
chmod -R 777 logs/

# Or run as root (not recommended)
docker-compose exec -u root api <command>
```

### Hot Reload Not Working

```bash
# Ensure volumes are mounted correctly
docker-compose down
docker-compose up -d

# Check volume mounts
docker-compose exec api ls -la /usr/src/app
```

## Production Deployment

### Using Docker Compose

```bash
# 1. Set up environment
cp .env.docker.example .env
nano .env  # Edit with production values

# 2. Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec api npm run migrate

# 5. Create admin
docker-compose -f docker-compose.prod.yml exec api npm run seed-admin

# 6. Check health
curl http://your-domain.com/health
```

### Using Docker Swarm or Kubernetes

See separate deployment guides for:
- Docker Swarm: `docs/DOCKER_SWARM.md`
- Kubernetes: `docs/KUBERNETES.md`

## Best Practices

### Development
✅ Use `docker-compose.yml` for local development
✅ Keep volumes mounted for hot reload
✅ Use weak credentials (they're isolated)
✅ Commit `docker-compose.yml` to git

### Production
✅ Use `docker-compose.prod.yml` for production
✅ Generate strong, unique secrets
✅ Use environment variables from `.env`
✅ Never commit `.env` to git
✅ Set up log rotation
✅ Configure backups for PostgreSQL volume
✅ Use HTTPS with reverse proxy (Nginx/Traefik)
✅ Monitor container health
✅ Set resource limits

## Health Checks

Both containers include health checks:

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready
```

## Scaling

```bash
# Scale API instances (requires load balancer)
docker-compose up -d --scale api=3

# Note: You'll need to configure a load balancer
# and remove container_name from docker-compose.yml
```

## Monitoring

```bash
# Container stats
docker stats

# Specific container
docker stats audit_api

# Disk usage
docker system df

# Container processes
docker-compose top
```

## Next Steps

1. ✅ Start services: `docker-compose up -d`
2. ✅ Run migrations: `docker-compose exec api npm run migrate`
3. ✅ Create admin: `docker-compose exec api npm run seed-admin`
4. ✅ Test API: `curl http://localhost:3000/health`
5. ✅ View logs: `docker-compose logs -f api`
6. ✅ Start coding! Changes auto-reload.

## Support

- Docker Issues: Check `docker-compose logs`
- API Issues: See main `README.md`
- Setup Help: See `GETTING_STARTED.md`

