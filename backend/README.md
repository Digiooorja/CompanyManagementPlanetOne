# Backend API for DOS Planet One Project Tracking

Backend API server built with Node.js, Express, Sequelize ORM, and MariaDB/MySQL.

## Prerequisites

- Node.js (v14 or higher)
- MariaDB or MySQL (v10.5+ or v8.0+)

## Installation

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Environment Variables

Create a `.env` file in the **repo root** (not inside `backend/`) with:
```
DATABASE_URL=mysql://username:password@localhost:3306/dos_planet_tracking
PORT=5000
JWT_SECRET=your_secret_key_here
```
See [.env.example](../.env.example) in the repo root for the full list of variables (AWS/S3, SMTP, backup overrides).

For remote or Docker-based databases, update the URL accordingly.

## Database Setup

### New Database (first time)

1. Create an empty database called `dos_planet_tracking` in your MariaDB/MySQL server.
2. Run the migration runner to build all tables:
   ```
   npm run migrate
   ```
   The first migration (`20260604_000_init_baseline.sql`) creates every table.
   All subsequent migrations apply incremental changes in order.
3. Optionally seed initial data:
   ```
   npm run seed:demo
   npm run seed:blocks
   ```

### Existing Database (pulling new code)

When you pull code that includes new migration files, just run:
```
npm run migrate
```
The runner tracks which migrations have already been applied and only executes new ones.

## Database Migrations

All schema changes are managed through SQL migration files in the `migrations/` directory.

### How it works

- Each `.sql` file in `migrations/` is named with a date prefix so they run in chronological order (e.g. `20260604_001_create_licences_table.sql`).
- The runner maintains a `_migrations` tracking table in the database. Each applied file is recorded there, so it is never re-run.
- Migrations use `IF NOT EXISTS` and `IF EXISTS` guards where appropriate, making them safe to run on both new and existing databases.

### Adding a new migration

1. Create a new `.sql` file in `migrations/` with the naming convention:
   ```
   YYYYMMDD_NNN_description.sql
   ```
   Example: `20260610_002_add_delegation_to_finances.sql`

2. Write your MariaDB-compatible SQL inside it.

3. Test locally:
   ```
   npm run migrate
   ```

4. Commit both the migration file and any related model changes to Git.

### Available npm scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm start`        | Start the production server          |
| `npm run dev`      | Start with auto-restart (nodemon)    |
| `npm run migrate`  | Apply pending database migrations    |
| `npm run migrate:fake` | Mark pending migrations as applied without running SQL |
| `npm run seed`     | Seed the database with sample data   |
| `npm run seed:blocks` | Seed concession block data        |
| `npm run seed:demo`   | Seed a demo user account           |
| `npm test`         | Run the automated test suite (Jest + Supertest) |

### Fake migrations

Use fake migrations when the schema was already changed manually (or by another tool)
and you only need to advance the migration tracker.

Examples:
```
npm run migrate:fake
npm run migrate -- --fake --to=20260604_010_add_linked_milestone_to_activities.sql
```

## Testing

Automated tests live in `tests/` (Jest + Supertest), run against a dedicated database
configured in `.env.test` (never the dev/production database). Run them with:
```
npm test
```
A safety guard (`tests/env.setup.js` + `tests/globalSetup.js`) refuses to run unless the
resolved database name contains "test", and the test database is dropped and rebuilt from
the current Sequelize models on every run for a clean slate. See `tests/globalSetup.js` for
how the test schema is bootstrapped, and `tests/helpers/` for reusable fixtures (JWT signing,
seeding a Role/Permission for RBAC tests, seeding a User for FK-constrained columns).

## Running the Server

```
npm run dev
```

The server runs on `http://localhost:5000`. On startup, Sequelize will sync model definitions with the database.

## API Endpoints

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Blocks
- `GET /api/blocks` - Get all blocks
- `GET /api/blocks/:id` - Get block by ID
- `POST /api/blocks` - Create new block
- `PUT /api/blocks/:id` - Update block
- `DELETE /api/blocks/:id` - Delete block

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Finance / AFE
- `GET /api/finance` - Get all finance items
- `GET /api/finance/:id` - Get finance item by ID
- `POST /api/finance` - Create new finance item
- `PUT /api/finance/:id` - Update finance item
- `DELETE /api/finance/:id` - Delete finance item

### Licences
- `GET /api/licences` - Get all licences (enriched with block names)
- `GET /api/licences/:id` - Get licence by ID
- `POST /api/licences` - Create new licence (Manager+)
- `PUT /api/licences/:id` - Update licence (Manager+)
- `DELETE /api/licences/:id` - Delete licence (Admin only)

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Registers
- `GET /api/registers` - Get all registers
- `GET /api/registers/:id` - Get register by ID
- `POST /api/registers` - Create new register
- `PUT /api/registers/:id` - Update register
- `DELETE /api/registers/:id` - Delete register

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/:id` - Get notification by ID
- `POST /api/notifications` - Create new notification
- `PUT /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report by ID
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Comments
- `GET /api/comments` - Get all comments
- `POST /api/comments` - Create new comment
- `DELETE /api/comments/:id` - Delete comment

### Risks
- `GET /api/risks` - Get all risks
- `POST /api/risks` - Create new risk
- `PUT /api/risks/:id` - Update risk
- `DELETE /api/risks/:id` - Delete risk

### Departments
- `GET /api/departments` - Get all departments

### Admin (Admin role required)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/dashboard` - Get admin dashboard stats

### Auth
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile