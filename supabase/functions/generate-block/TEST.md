# Testing generate-block Edge Function

## Setup Required

1. Add OpenAI API key to `.env` file in project root:
```bash
echo "OPENAI_API_KEY=sk-..." >> .env
```

2. Start function with env file:
```bash
supabase functions serve generate-block --env-file .env
```

## Test Cases

### 1. Generate First Block (No Previous Block)

```bash
TOKEN="your_jwt_token"

curl -s 'http://127.0.0.1:54321/functions/v1/generate-block' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"seedHint":"fantasy world"}' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "block": {
    "id": 2,
    "status": "active",
    "seed_hint": "fantasy world",
    "difficulty_config": {
      "minLength": 6,
      "maxLength": 12,
      "charset": "alphanumeric + common symbols",
      "description": "moderate - mix of letters, numbers, and symbols"
    },
    "created_at": "2026-01-14T07:00:00Z"
  },
  "difficulty_desc": "AI-generated password with fantasy theme"
}
```

### 2. Winner Generates Next Block

```bash
# First, solve block 1 to become winner
curl -s 'http://127.0.0.1:54321/functions/v1/check-answer' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"inputValue":"123456","blockId":1}' | jq

# Then generate next block as winner
curl -s 'http://127.0.0.1:54321/functions/v1/generate-block' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"seedHint":"cyberpunk city","previousBlockId":1}' | jq
```

**Expected:** New block created, previous block status changed to "completed"

### 3. Non-Winner Tries to Generate (Should Fail)

```bash
# Use different user token
curl -s 'http://127.0.0.1:54321/functions/v1/generate-block' \
  -H "Authorization: Bearer $ANOTHER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"seedHint":"hacker","previousBlockId":1}' | jq
```

**Expected Response:**
```json
{
  "error": "Only the winner can generate the next block"
}
```

### 4. 180s Timeout Scenario (Manual Test)

Simulates timeout by calling generate-block without winner (after 180s):

```bash
# After 180 seconds of no solution, any admin can trigger
curl -s 'http://127.0.0.1:54321/functions/v1/generate-block' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"seedHint":"default random","previousBlockId":1}' | jq
```

## Database Verification

Check blocks table:
```bash
docker exec supabase_db_brute-force psql -U postgres -d postgres \
  -c "SELECT id, status, seed_hint, winner_id, created_at FROM blocks ORDER BY id;"
```

Check that password was hashed and stored:
```bash
docker exec supabase_db_brute-force psql -U postgres -d postgres \
  -c "SELECT id, LENGTH(answer_hash) as hash_len, LENGTH(answer_plaintext) as plain_len FROM blocks ORDER BY id;"
```

## Implementation Notes

### ChatGPT Integration
- **Model**: `gpt-4o-mini` (ChatGPT 5 mini equivalent)
- **Temperature**: 0.8 (for creative password generation)
- **Max Tokens**: 200
- **Prompt Strategy**: Instructs AI to return only valid JSON with password and difficulty description

### Security
- Password plaintext stored in `answer_plaintext` for similarity calculation (RLS protected)
- Password hash stored in `answer_hash` for verification
- Only winners can generate next block after solving current one
- Service role key used for all DB operations

### Error Handling
- Missing OpenAI API key → returns error immediately
- Invalid ChatGPT response → retries parsing
- Password out of bounds → rejected
- Non-JSON response → error with details

### Workflow
1. User solves block → becomes winner (`winner_id` set)
2. Winner calls `generate-block` with seed hint
3. Function validates winner status
4. Calls ChatGPT API with hint + difficulty config
5. Hashes generated password
6. Inserts new block as "active"
7. Updates previous block to "completed"
8. Returns new block info to client
