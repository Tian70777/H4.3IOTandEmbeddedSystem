# Database Setup Guide

## Prerequisites

Download and install PostgreSQL from: https://www.postgresql.org/download/windows/

During installation:
- Set a password for the `postgres` user (remember this!)
- Default port: 5432 (keep default)
- Install pgAdmin 4 (included with PostgreSQL)

## Setup Steps

### 1. Create Database

Open **pgAdmin 4** or **psql** command line:

#### Using pgAdmin 4:
1. Right-click "Databases" → "Create" → "Database"
2. Database name: `smart_home`
3. Click "Save"

#### Using psql:
```bash
psql -U postgres
CREATE DATABASE smart_home;
\q
```

### 2. Run Schema

Connect to the database and run the schema file:

#### Using pgAdmin 4:
1. Select `smart_home` database
2. Click "Query Tool"
3. Open `schema.sql` file
4. Click "Execute" (F5)

#### Using psql:
```bash
psql -U postgres -d smart_home -f schema.sql
```

### 3. Verify Table Creation

Check if the table was created:

```sql
\c smart_home
\dt
SELECT * FROM sensor_readings LIMIT 1;
```

You should see the `sensor_readings` table listed.

### 4. Configure Backend

Copy `.env.example` to `.env` in the backend folder:

```bash
cd backend
copy .env.example .env
```

Edit `.env` and update the database password:

```
DB_PASSWORD=your_postgres_password_here
```

## Common Commands

### Check Database Connection
```bash
psql -U postgres -d smart_home
```

### View All Tables
```sql
\dt
```

### View Table Structure
```sql
\d sensor_readings
```

### View Recent Data
```sql
SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 10;
```

### Delete All Data (for testing)
```sql
TRUNCATE TABLE sensor_readings;
```

### Get Statistics
```sql
SELECT 
    COUNT(*) as total_readings,
    AVG(temperature) as avg_temp,
    AVG(humidity) as avg_humidity
FROM sensor_readings
WHERE timestamp >= NOW() - INTERVAL '24 hours';
```

## Troubleshooting

**Cannot connect to PostgreSQL:**
- Check if PostgreSQL service is running (Windows Services)
- Verify port 5432 is not blocked
- Check username and password

**Table already exists error:**
- The schema uses `CREATE TABLE IF NOT EXISTS`, so this is normal
- No action needed

**Permission denied:**
- Make sure you're using the `postgres` superuser
- Or create a new user with proper permissions

## Creating a New User (Optional)

```sql
CREATE USER smart_home_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smart_home TO smart_home_user;
\c smart_home
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smart_home_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smart_home_user;
```

Then update `.env`:
```
DB_USER=smart_home_user
DB_PASSWORD=your_password
```
