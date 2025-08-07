---
id: task-2
title: Create API endpoint for event creation
status: Done
assignee: []
created_date: '2025-08-07 00:07'
updated_date: '2025-08-07 00:39'
labels:
  - api
  - backend
  - supabase
dependencies: []
priority: high
---

## Description

Build a secure backend API endpoint at POST /api/events to handle event creation requests, validate tennis event data, and store events in Supabase database

## Acceptance Criteria

- [ ] API endpoint accepts POST requests at /api/events
- [ ] Request payload validation for required tennis event fields
- [ ] Successfully creates event records in Supabase database
- [ ] Returns appropriate HTTP status codes and error messages
- [ ] Handles database connection errors gracefully
