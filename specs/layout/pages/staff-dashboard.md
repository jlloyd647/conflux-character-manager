# Login Page

## Purpose

The Login Page allows users to authenticate into the application.

Users must log in before accessing protected routes such as dashboard, characters, staff tools, or admin tools.

## Responsibilities

- Display the login form
- Collect the user’s email and password
- Submit login credentials
- Show loading state during login
- Show error messages when login fails
- Redirect authenticated users after successful login

---

## Does Not Own

- Authentication service implementation
- Supabase configuration
- User role management
- Protected route logic
- Password reset workflows
- Account creation workflows

---

## Rules

- The page must use the shared authentication service
- The page must not call Supabase directly
- The page must not store passwords
- The page must show a clear error if login fails
- The page must redirect successful users to `/dashboard`
- The page should remain focused only on logging in
- Account creation and password reset should be handled by separate pages or flows

---

## Fields

### Email

- Required
- Must be a valid email format

### Password

- Required
- Must be hidden by default

---

## States

### Default

- Form is visible
- Submit button is enabled

### Loading

- Submit button is disabled
- Loading text or spinner is displayed

### Error

- Error message is displayed
- Form remains editable

### Success

- User is redirected to `/dashboard`