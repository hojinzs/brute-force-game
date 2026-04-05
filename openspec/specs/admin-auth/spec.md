## ADDED Requirements

### Requirement: User role enum

The system SHALL define a `UserRole` enum with values `USER` and `MASTER`.

#### Scenario: Default role assignment
- **WHEN** a new user registers or creates an anonymous account
- **THEN** the user's role SHALL be set to `USER` by default

#### Scenario: Role stored in database
- **WHEN** a user is created
- **THEN** the `role` column in the `users` table SHALL store the enum value

### Requirement: Role field in User model

The User Prisma model SHALL include a `role` field of type `UserRole` with default value `USER`.

#### Scenario: User model includes role
- **WHEN** the User model is defined in Prisma schema
- **THEN** it SHALL include `role UserRole @default(USER)`

#### Scenario: Role included in JWT payload
- **WHEN** a user authenticates successfully
- **THEN** the JWT access token payload SHALL include the user's `role` field

### Requirement: Master role guard

The system SHALL provide a `@MasterOnly()` decorator that restricts endpoint access to users with `MASTER` role.

#### Scenario: Master user accesses protected endpoint
- **WHEN** a user with role `MASTER` accesses a `@MasterOnly()` protected endpoint
- **THEN** the request SHALL be allowed to proceed

#### Scenario: Regular user denied access
- **WHEN** a user with role `USER` accesses a `@MasterOnly()` protected endpoint
- **THEN** the system SHALL return HTTP 403 Forbidden with message "Master role required"

#### Scenario: Unauthenticated user denied access
- **WHEN** an unauthenticated request accesses a `@MasterOnly()` protected endpoint
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: Role guard implementation

The `MasterGuard` SHALL be implemented as a NestJS CanActivate guard that checks the user's role from the JWT payload.

#### Scenario: Guard checks JWT role claim
- **WHEN** a request with valid JWT reaches a `@MasterOnly()` endpoint
- **THEN** the guard SHALL extract the `role` from the JWT payload and verify it equals `MASTER`

#### Scenario: Guard works with existing auth
- **WHEN** `@MasterOnly()` decorator is applied to an endpoint
- **THEN** it SHALL work in combination with the existing `@Auth()` decorator

### Requirement: Database migration for role column

A database migration SHALL add the `role` column to the `users` table.

#### Scenario: Migration adds role column
- **WHEN** the migration is applied
- **THEN** the `users` table SHALL have a `role` column of type enum with values 'USER', 'MASTER'

#### Scenario: Existing users get default role
- **WHEN** the migration is applied to an existing database
- **THEN** all existing users SHALL have their `role` set to `USER`
