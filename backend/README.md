# Backend API for DOS Planet One Project Tracking

This is the backend API server for the DOS Planet One Project Tracking application, built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (local installation or cloud service like Supabase, ElephantSQL, etc.)

## Installation

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Database Setup

### Option 1: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a database named `dos_planet_tracking`
3. Update `.env` file with your local PostgreSQL connection:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dos_planet_tracking
   ```

### Option 2: Cloud PostgreSQL (Supabase, ElephantSQL, etc.)
1. Create an account with a PostgreSQL cloud provider
2. Create a new database
3. Get your connection string
4. Update `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

## Environment Variables

Create a `.env` file in the backend root with:
```
DATABASE_URL=your_postgresql_connection_string
PORT=5000
```

## Running the Server

- Start the server:
  ```
  npm start
  ```

- For development with auto-restart:
  ```
  npm run dev
  ```

The server will run on `http://localhost:5000` and automatically create/sync database tables.

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

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Registers
- `GET /api/registers` - Get all registers
- `GET /api/registers/:id` - Get register by ID
- `POST /api/registers` - Create new register
- `PUT /api/registers/:id` - Update register
- `DELETE /api/registers/:id` - Delete register

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Finance
- `GET /api/finance` - Get all finance items
- `GET /api/finance/:id` - Get finance item by ID
- `POST /api/finance` - Create new finance item
- `PUT /api/finance/:id` - Update finance item
- `DELETE /api/finance/:id` - Delete finance item

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

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/dashboard` - Get admin dashboard stats

## Data Storage

Currently uses in-memory storage. For production, integrate with a database like MongoDB, PostgreSQL, etc.

## CORS

CORS is enabled to allow requests from the frontend.