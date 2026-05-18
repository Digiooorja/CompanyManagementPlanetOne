# Sub-Activities Feature Implementation Guide

## Overview
The sub-activities feature allows you to create hierarchical relationships between activities in your project. Each main activity can have multiple sub-activities (child activities), which helps organize work into smaller, manageable tasks.

## Features Implemented

### 1. Database Schema Updates
- **New Columns Added to `activities` table:**
  - `parentActivityId` (INTEGER): References the parent activity for sub-activities
  - `projectId` (INTEGER): Links activity to a specific project
  - `priority` (VARCHAR): Activity priority level (Low, Medium, High, Critical)
  - `assignedTo` (VARCHAR): Person assigned to the activity
  - `dueDate` (TIMESTAMP): Due date for the activity
  - `progress` (INTEGER 0-100): Progress percentage

- **Constraints:**
  - Cascade delete: Deleting a parent activity deletes all sub-activities
  - Self-referencing: Activities can have other activities as children

### 2. Backend Model (`Activity.js`)
- Added all new fields to Sequelize model
- Implemented associations:
  - `hasMany`: Activity → Sub-Activities relationship
  - `belongsTo`: Sub-Activity → Parent Activity relationship

### 3. Backend Routes (`routes/activities.js`)
New endpoints:
- `GET /activities` - Get all parent activities with sub-activities included
- `GET /activities/:id` - Get activity by ID with sub-activities
- `GET /activities/:id/sub-activities` - Get only sub-activities of a parent
- `POST /activities` - Create activity or sub-activity (supports `parentActivityId`)
- `PUT /activities/:id` - Update activity (can reassign parent)
- `DELETE /activities/:id` - Delete activity (cascades to children)
- `POST /activities/bulk/update` - Batch update multiple activities

### 4. Frontend API Service (`services/api.ts`)
New API methods:
```typescript
activitiesApi.getSubActivities(id: number)        // Get sub-activities
activitiesApi.createSubActivity(parentId, data)   // Create sub-activity
activitiesApi.bulkUpdate(activities)              // Bulk update activities
```

### 5. Frontend UI Enhancements

#### Activities List View
- Expandable/collapsible parent activities
- Indented display of sub-activities
- Quick status badges for each sub-activity
- Progress indicators

#### Activity Detail Page
- New "Sub-Activities" section
- Add Sub-Activity button
- Form to create new sub-activities with:
  - Name
  - Description
  - Priority
  - Status
- Display all sub-activities with:
  - Name and description
  - Priority badge
  - Status badge
  - Progress bar
  - Mark as Complete button
  - Delete button
  - Progress percentage selector

## Database Migration

### For New Database
The schema is already updated in `schema.sql`. Simply run:
```bash
psql -U username -d database_name -f schema.sql
```

### For Existing Database
Run the migration script:
```bash
psql -U username -d database_name -f backend/migrations/add-sub-activities.sql
```

## Usage Examples

### Creating a Parent Activity
```bash
POST /api/activities
{
  "name": "Review drilling plan",
  "description": "Comprehensive review of drilling procedures",
  "status": "Active",
  "priority": "High",
  "assignedTo": "Mike Chen",
  "dueDate": "2026-05-05",
  "progress": 0
}
```

### Creating a Sub-Activity
```bash
POST /api/activities
{
  "name": "Check equipment specifications",
  "description": "Verify all equipment meets requirements",
  "status": "Active",
  "priority": "High",
  "parentActivityId": 1,
  "progress": 0
}
```

### Updating Sub-Activity Progress
```bash
PUT /api/activities/:subActivityId
{
  "progress": 75,
  "status": "Active"
}
```

### Fetching Activity with Sub-Activities
```bash
GET /api/activities/1
```
Response includes:
```json
{
  "id": 1,
  "name": "Review drilling plan",
  "description": "...",
  "status": "Active",
  "priority": "High",
  "progress": 50,
  "subActivities": [
    {
      "id": 101,
      "name": "Check equipment",
      "status": "In Progress",
      "priority": "High",
      "progress": 75
    },
    {
      "id": 102,
      "name": "Review procedures",
      "status": "Active",
      "priority": "Medium",
      "progress": 0
    }
  ]
}
```

## Frontend Components

### Activities List View
- Shows only parent activities
- Expandable rows to show sub-activities
- Each sub-activity row is indented and has gray background
- Can expand/collapse by clicking the chevron icon

### Activity Detail Page
- Displays full activity information
- Dedicated "Sub-Activities" section with:
  - Button to add new sub-activity
  - Form (toggleable) to create sub-activities
  - List of all sub-activities with management options

## Best Practices

1. **Parent-Child Hierarchy**: Keep activities to a maximum of 2 levels (parent and sub-activity) for better UX
2. **Progress Calculation**: Progress of parent should be average of all sub-activities
3. **Status Management**: Consider making parent status based on sub-activity statuses
4. **Naming Convention**: Use clear, actionable names for sub-activities
5. **Assignment**: Keep assignments at the sub-activity level when possible

## Validation Rules

- **No Self-Reference**: An activity cannot be its own parent
- **Parent Existence**: When creating a sub-activity, the parent must exist
- **Progress Range**: Progress must be between 0-100
- **Cascade Delete**: Deleting a parent deletes all children

## Future Enhancements

Potential features for future iterations:
- [ ] Bulk edit sub-activities
- [ ] Activity templates with pre-defined sub-activities
- [ ] Automatic parent progress calculation
- [ ] Activity dependencies and critical path
- [ ] Activity time tracking
- [ ] Recurring activities/sub-activities
- [ ] Activity notifications and reminders
