---
id: task-42
title: Replace mock API with real database connection for events
status: Done
assignee: []
created_date: '2025-08-07 04:43'
updated_date: '2025-08-07 15:22'
labels:
  - api
  - database
  - events
  - backend
dependencies:
  - task-41
priority: high
---

## Description

Update the event creation form and API endpoint to use the real Supabase database instead of the mock endpoint, ensuring proper authentication and data persistence

## Acceptance Criteria

- [ ] Event creation form submits to /api/events instead of /api/events/mock
- [ ] Real database connection is established and tested
- [ ] User authentication is verified before event creation
- [ ] Event data is properly inserted into events table
- [ ] Success and error responses match expected format
