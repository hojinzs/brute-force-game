## Architecture

The admin console SHALL be implemented as a **separate Next.js application** at `/apps/console`, independent from the main web app (`/apps/web`).

### Technical Stack (mirrors main web app)
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **State**: TanStack Query (server state), Zustand (client state)
- **API**: Shared NestJS backend (`/apps/api`)
- **Path Alias**: `@console/*` pointing to `/apps/console/*`

### Deployment
- Separate deployment target (e.g., `console.bruteforce.app` or internal-only domain)
- Can be restricted at infrastructure level (VPN, IP whitelist, etc.)

---

## ADDED Requirements

### Requirement: Admin console authentication

The admin console app SHALL only be accessible to authenticated users with MASTER role.

#### Scenario: Master user accesses admin console
- **WHEN** a user with MASTER role navigates to the console app root (`/`)
- **THEN** the admin console dashboard SHALL be displayed

#### Scenario: Regular user redirected
- **WHEN** a user with USER role navigates to the console app
- **THEN** the system SHALL display an "Access denied" error page with link to main game

#### Scenario: Unauthenticated user redirected
- **WHEN** an unauthenticated user navigates to the console app
- **THEN** the system SHALL redirect to the login page (can use shared auth or dedicated login)

### Requirement: Admin dashboard overview

The admin console SHALL display a dashboard with key system metrics at `/` (app root).

#### Scenario: Dashboard shows block status
- **WHEN** a MASTER user views the admin dashboard
- **THEN** it SHALL display the current block's status, ID, and time in current state

#### Scenario: Dashboard shows user counts
- **WHEN** a MASTER user views the admin dashboard
- **THEN** it SHALL display total users, active users (last 24h), and online users count

#### Scenario: Dashboard shows alerts
- **WHEN** a block is stuck in WAITING_HINT or WAITING_PASSWORD for more than 5 minutes
- **THEN** the dashboard SHALL display a warning alert with intervention options

### Requirement: Block management page

The admin console SHALL provide a block management page at `/blocks`.

#### Scenario: View all blocks
- **WHEN** a MASTER user navigates to `/blocks`
- **THEN** the page SHALL display a table of all blocks with status, ID, winner, and timestamps

#### Scenario: View block details
- **WHEN** a MASTER user clicks on a block row
- **THEN** a detail panel SHALL show full block information including answerPlaintext

#### Scenario: Force transition UI
- **WHEN** a MASTER user views a block in WAITING_HINT or WAITING_PASSWORD status
- **THEN** the UI SHALL provide buttons to force transition with required inputs (hint or password)

#### Scenario: Skip block UI
- **WHEN** a MASTER user views any non-SOLVED block
- **THEN** the UI SHALL provide a "Skip Block" button with confirmation dialog

### Requirement: User management page

The admin console SHALL provide a user management page at `/users`.

#### Scenario: View user list
- **WHEN** a MASTER user navigates to `/users`
- **THEN** the page SHALL display a searchable, filterable table of all users

#### Scenario: Search users
- **WHEN** a MASTER user enters a search term
- **THEN** the table SHALL filter to show users matching the nickname

#### Scenario: View user detail
- **WHEN** a MASTER user clicks on a user row
- **THEN** a detail panel SHALL show full user information and recent activity

#### Scenario: Change user role
- **WHEN** a MASTER user clicks "Change Role" for another user
- **THEN** a dropdown SHALL allow selecting USER or MASTER with confirmation

### Requirement: Real-time updates

The admin console SHALL receive real-time updates for critical events.

#### Scenario: Block status change notification
- **WHEN** the current block's status changes
- **THEN** the admin console SHALL update the displayed status without page refresh

#### Scenario: New user notification
- **WHEN** a new user registers
- **THEN** the admin dashboard user count SHALL update in real-time

### Requirement: Admin console styling

The admin console SHALL follow the existing "Clean-Tech Hacker" design aesthetic.

#### Scenario: Consistent dark theme
- **WHEN** the admin console is displayed
- **THEN** it SHALL use the same dark mode colors and typography as the main game

#### Scenario: Distinct admin indicator
- **WHEN** a MASTER user is in the admin console
- **THEN** the UI SHALL display a clear "MASTER" badge and distinct header color to indicate admin mode

### Requirement: Mobile responsiveness

The admin console SHALL be usable on mobile devices for emergency interventions.

#### Scenario: Responsive layout
- **WHEN** the admin console is viewed on a mobile device
- **THEN** the layout SHALL adapt to show essential information and actions

#### Scenario: Critical actions accessible
- **WHEN** a MASTER user accesses admin console on mobile
- **THEN** block intervention actions SHALL be accessible within 2 taps
