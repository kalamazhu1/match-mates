---
id: task-27
title: Create user profile database insertion after auth signup
status: To Do
assignee: []
created_date: '2025-08-07 00:26'
labels:
  - authentication
  - database
  - backend
dependencies:
  - task-26
priority: high
---

## Description

Implement the database insertion logic to create user profiles in the public.users table after successful Supabase authentication registration. This ensures that tennis-specific profile data is stored and synced with the authentication system.

## Acceptance Criteria

- [ ] User profile is created in public.users table after auth signup
- [ ] Profile data includes name
- [ ] NTRP level
- [ ] phone from sign-up form
- [ ] Database insertion is triggered automatically after successful auth creation
- [ ] User profile data is properly synced with Supabase auth.users
- [ ] Database errors are handled gracefully with appropriate fallbacks
- [ ] Profile creation follows existing database schema constraints
