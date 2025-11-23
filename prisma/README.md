# Database Setup Guide

## Prerequisites

- PostgreSQL 15+ installed and running
- Database created: `dashboard_analytics`

## Initial Setup

1. **Configure Database Connection**

   Update the `.env` file with your PostgreSQL credentials:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/dashboard_analytics?schema=public"
   ```

2. **Generate Prisma Client**

   ```bash
   npm run prisma:generate
   ```

3. **Run Migrations**

   ```bash
   npm run prisma:migrate
   ```

   This will create all the necessary tables and relationships in your database.

4. **Seed the Database**

   ```bash
   npm run prisma:seed
   ```

   This will populate the database with:
   - 3 test users (Admin, Analyst, Viewer)
   - 3 example dashboards
   - Multiple widgets with different chart types
   - Sample layouts
   - Dashboard shares
   - Scheduled reports

## Test Credentials

After seeding, you can use these credentials to test the application:

- **Admin User**
  - Email: `admin@dashboard.com`
  - Password: `admin123`
  - Role: ADMIN (full access)

- **Analyst User**
  - Email: `analyst@dashboard.com`
  - Password: `analyst123`
  - Role: ANALYST (can create and edit dashboards)

- **Viewer User**
  - Email: `viewer@dashboard.com`
  - Password: `viewer123`
  - Role: VIEWER (read-only access)

## Database Schema

### Tables

- **users**: User accounts with role-based access control
- **dashboards**: Dashboard configurations
- **widgets**: Individual chart/visualization components
- **layouts**: User-specific dashboard layouts and themes
- **dashboard_shares**: Dashboard sharing permissions
- **schedules**: Automated report schedules

### Enums

- **Role**: ADMIN, ANALYST, VIEWER
- **WidgetType**: LINE_CHART, BAR_CHART, PIE_CHART, AREA_CHART, HEATMAP, SCATTER_CHART, TABLE, METRIC
- **Theme**: LIGHT, DARK
- **Permission**: VIEW, EDIT, ADMIN
- **ExportFormat**: PDF, CSV, XLSX

## Useful Commands

```bash
# Open Prisma Studio (GUI for database)
npm run prisma:studio

# Push schema changes without migration
npm run db:push

# Reset database (WARNING: deletes all data)
npm run db:reset

# Create a new migration
npx prisma migrate dev --name migration_name
```

## Migration Files

Migrations are stored in `prisma/migrations/` directory. Each migration has:
- A timestamp-based folder name
- A `migration.sql` file with the SQL commands

The initial migration (`20250118000000_init`) creates all tables, indexes, and foreign key constraints.

## Indexes

The schema includes indexes on frequently queried columns:
- `users.email`
- `dashboards.userId`, `dashboards.createdAt`
- `widgets.dashboardId`
- `layouts.userId`, `layouts.dashboardId`
- `dashboard_shares.dashboardId`, `dashboard_shares.userId`
- `schedules.userId`, `schedules.isActive`, `schedules.nextRun`

## Foreign Key Constraints

All relationships use `CASCADE` delete behavior:
- Deleting a user deletes their dashboards, layouts, and schedules
- Deleting a dashboard deletes its widgets, layouts, and shares
- This ensures data integrity and prevents orphaned records

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure the database exists: `createdb dashboard_analytics`

### Migration Issues

If migrations fail:
1. Check database connection
2. Verify no conflicting schema changes
3. Use `npm run db:reset` to start fresh (development only)

### Seed Issues

If seeding fails:
1. Ensure migrations have been run
2. Check for unique constraint violations
3. Clear existing data with `npm run db:reset` and try again
