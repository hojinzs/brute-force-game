## ADDED Requirements

### Requirement: Admin users list endpoint

The system SHALL provide a `GET /api/admin/users` endpoint that returns all registered users with detailed information.

#### Scenario: Master retrieves user list
- **WHEN** a MASTER user requests `GET /api/admin/users`
- **THEN** the system SHALL return a paginated list of all users

#### Scenario: User list includes key metrics
- **WHEN** the user list is returned
- **THEN** each user object SHALL include: id, nickname, email (if not anonymous), role, isAnonymous, cpCount, totalPoints, createdAt

#### Scenario: User list supports filtering
- **WHEN** a MASTER user requests `GET /api/admin/users?role=MASTER`
- **THEN** the system SHALL return only users with MASTER role

#### Scenario: User list supports search
- **WHEN** a MASTER user requests `GET /api/admin/users?search=nickname`
- **THEN** the system SHALL return users whose nickname contains the search term

### Requirement: Admin user detail endpoint

The system SHALL provide a `GET /api/admin/users/:id` endpoint that returns complete user information.

#### Scenario: Master retrieves user detail
- **WHEN** a MASTER user requests `GET /api/admin/users/:id`
- **THEN** the response SHALL include all user fields and recent activity summary

#### Scenario: User detail includes attempt history
- **WHEN** a MASTER user retrieves user detail
- **THEN** the response SHALL include the user's recent attempt count and success rate

#### Scenario: User not found
- **WHEN** a MASTER user requests a non-existent user ID
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Update user role endpoint

The system SHALL provide a `PUT /api/admin/users/:id/role` endpoint to change a user's role.

#### Scenario: Promote user to MASTER
- **WHEN** a MASTER user sends `PUT /api/admin/users/:id/role` with `{ role: "MASTER" }`
- **THEN** the target user's role SHALL be updated to MASTER

#### Scenario: Demote MASTER to USER
- **WHEN** a MASTER user sends `PUT /api/admin/users/:id/role` with `{ role: "USER" }`
- **THEN** the target user's role SHALL be updated to USER

#### Scenario: Cannot change own role
- **WHEN** a MASTER user attempts to change their own role
- **THEN** the system SHALL return HTTP 400 Bad Request with message "Cannot modify own role"

#### Scenario: Role change logged
- **WHEN** a user's role is changed
- **THEN** the system SHALL log the action with timestamp, acting MASTER user ID, target user ID, previous role, and new role

### Requirement: Admin user statistics endpoint

The system SHALL provide a `GET /api/admin/users/stats` endpoint for aggregate user metrics.

#### Scenario: Retrieve user statistics
- **WHEN** a MASTER user requests `GET /api/admin/users/stats`
- **THEN** the response SHALL include: totalUsers, totalAnonymous, totalRegistered, totalMasters, activeUsersLast24h, newUsersToday

### Requirement: Reset user CP endpoint

The system SHALL provide a `POST /api/admin/users/:id/reset-cp` endpoint to reset a user's CP to maximum.

#### Scenario: Reset user CP
- **WHEN** a MASTER user sends `POST /api/admin/users/:id/reset-cp`
- **THEN** the target user's cpCount SHALL be set to 50 (max) and lastCpRefillAt updated

#### Scenario: CP reset logged
- **WHEN** a user's CP is reset by admin
- **THEN** the system SHALL log the action with timestamp and reason
