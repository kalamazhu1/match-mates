---
id: task-37
title: Add social sign-up options
status: To Do
assignee: []
created_date: '2025-08-07 00:27'
labels:
  - authentication
  - social-auth
  - integration
dependencies:
  - task-27
priority: low
---

## Description

Implement social authentication options (Google/Apple) for user registration to provide convenient alternative sign-up methods. This should integrate with existing Supabase social auth providers while maintaining the same user profile creation flow.

## Acceptance Criteria

- [ ] Google sign-up option is available and functional
- [ ] Apple sign-up option is available and functional
- [ ] Social auth integrates with Supabase authentication
- [ ] User profiles are still created in database after social sign-up
- [ ] Tennis-specific profile data collection works with social auth
- [ ] Social sign-up maintains same validation and error handling
- [ ] Users can link social accounts to existing email accounts
