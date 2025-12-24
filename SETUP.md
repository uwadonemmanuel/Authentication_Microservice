# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb auth_service
   
   # Or using psql:
   psql -U postgres -c "CREATE DATABASE auth_service;"
   ```

4. **Setup Redis**
   ```bash
   # Make sure Redis is running
   redis-server
   ```

5. **Run Migrations (Optional)**
   ```bash
   npm run migrate
   ```

6. **Start the Server**
   ```bash
   npm run dev
   ```

## VS Code Setup

1. Install recommended extensions:
   - ESLint
   - Prettier
   - Jest Runner

2. Use the launch configuration in `.vscode/launch.json` to debug

3. Run tests using the Jest configuration

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Environment Variables Required

Make sure to set up all environment variables in `.env`:

- Database credentials
- JWT secrets (use strong, random strings)
- Redis connection
- SendGrid API key (for emails)
- OAuth credentials (Google, GitHub)
- Frontend URL

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check Redis connection settings in `.env`

### Email Service Issues
- Verify SendGrid API key is correct
- Check FROM_EMAIL is a verified sender in SendGrid

### OAuth Issues
- Verify OAuth callback URLs match your configuration
- Check OAuth credentials in provider dashboards

