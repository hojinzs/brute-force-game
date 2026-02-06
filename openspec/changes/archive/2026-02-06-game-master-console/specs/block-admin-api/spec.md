## ADDED Requirements

### Requirement: Admin blocks list endpoint

The system SHALL provide a `GET /api/admin/blocks` endpoint that returns all blocks with full details including sensitive data.

#### Scenario: Master retrieves block list
- **WHEN** a MASTER user requests `GET /api/admin/blocks`
- **THEN** the system SHALL return a paginated list of all blocks including `answerPlaintext`

#### Scenario: Block list includes all statuses
- **WHEN** a MASTER user requests `GET /api/admin/blocks`
- **THEN** the response SHALL include blocks of all statuses (WAITING_HINT, WAITING_PASSWORD, ACTIVE, SOLVED)

#### Scenario: Non-master user denied
- **WHEN** a USER role user requests `GET /api/admin/blocks`
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: Admin block detail endpoint

The system SHALL provide a `GET /api/admin/blocks/:id` endpoint that returns complete block information including sensitive data.

#### Scenario: Master retrieves block detail
- **WHEN** a MASTER user requests `GET /api/admin/blocks/:id`
- **THEN** the response SHALL include all block fields including `answerPlaintext`, `answerHash`, and `difficultyConfig`

#### Scenario: Block not found
- **WHEN** a MASTER user requests a non-existent block ID
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Force block status transition

The system SHALL provide a `POST /api/admin/blocks/:id/force-transition` endpoint that allows MASTER users to force a block's status change.

#### Scenario: Force transition from WAITING_HINT to ACTIVE
- **WHEN** a MASTER user sends `POST /api/admin/blocks/:id/force-transition` with `{ targetStatus: "ACTIVE", hint: "forced hint" }`
- **AND** the block is in `WAITING_HINT` status
- **THEN** the system SHALL set the block's `seedHint` and transition status to `ACTIVE`

#### Scenario: Force transition from WAITING_PASSWORD to ACTIVE
- **WHEN** a MASTER user sends `POST /api/admin/blocks/:id/force-transition` with `{ targetStatus: "ACTIVE", password: "forced_password" }`
- **AND** the block is in `WAITING_PASSWORD` status
- **THEN** the system SHALL set the block's `answerPlaintext`, compute `answerHash`, and transition to `ACTIVE`

#### Scenario: Skip directly to next block
- **WHEN** a MASTER user sends `POST /api/admin/blocks/:id/force-transition` with `{ targetStatus: "SOLVED", reason: "manual skip" }`
- **THEN** the system SHALL mark the block as SOLVED without a winner and create the next block

#### Scenario: Invalid status transition rejected
- **WHEN** a MASTER user attempts an invalid status transition (e.g., SOLVED to ACTIVE)
- **THEN** the system SHALL return HTTP 400 Bad Request with explanation

### Requirement: Block intervention audit log

The system SHALL log all admin interventions on blocks for accountability.

#### Scenario: Force transition logged
- **WHEN** a MASTER user forces a block status transition
- **THEN** the system SHALL log the action with timestamp, MASTER user ID, block ID, previous status, new status, and reason

#### Scenario: Audit log queryable
- **WHEN** block intervention history is needed
- **THEN** the logs SHALL be queryable by block ID and by MASTER user ID

### Requirement: Regenerate block password

The system SHALL provide a `POST /api/admin/blocks/:id/regenerate-password` endpoint for stuck WAITING_PASSWORD blocks.

#### Scenario: Regenerate password for stuck block
- **WHEN** a MASTER user sends `POST /api/admin/blocks/:id/regenerate-password`
- **AND** the block is in `WAITING_PASSWORD` status
- **THEN** the system SHALL trigger the AI password generation process again

#### Scenario: Cannot regenerate for non-waiting blocks
- **WHEN** a MASTER user attempts to regenerate password for an ACTIVE or SOLVED block
- **THEN** the system SHALL return HTTP 400 Bad Request
