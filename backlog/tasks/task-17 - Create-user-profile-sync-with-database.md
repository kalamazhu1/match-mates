---
id: task-17
title: Create user profile sync with database
status: To Do
assignee: []
created_date: '2025-08-07 00:24'
labels:
  - authentication
  - database
  - sync
dependencies: []
priority: medium
---

## Description

Synchronize Supabase auth.users data with the public.users table to maintain consistent user profiles across authentication and application data

## Acceptance Criteria

- [ ] User data syncs between auth.users and public.users tables on sign-in
- [ ] Profile information is accessible through application queries
- [ ] Sync handles new user creation and existing user updates
- [ ] Database triggers or application logic maintains data consistency
- [ ] User profile data includes all necessary fields for tennis events
- [ ] Sync process handles edge cases and errors gracefully
