# NIP-XX: Chat Sessions

## Abstract

This NIP defines a custom event kind for managing chat sessions in Nostr clients. Chat sessions allow users to organize their conversations into separate threads with distinct identities and metadata.

## Event Kind

- `1005`: Chat Session

## Description

A chat session event (kind 1005) is a **replaceable event** that represents a distinct conversation thread. Each session has a unique identifier, name, and timestamp metadata.

## Event Structure

Chat session events MUST include the following tags:

- `d` - Session identifier (UUID v4 format recommended)
- `name` - Human-readable name for the session
- `last_edited` - Unix timestamp of the last edit to the session (as string)

The `content` field SHOULD be empty.

### Example Event

```json
{
  "kind": 1005,
  "content": "",
  "tags": [
    ["d", "b4f9c1f5-7a16-480f-a4e1-07b211269a55"],
    ["name", "My Chat Session"],
    ["last_edited", "1761290094"]
  ],
  "created_at": 1761290094,
  "pubkey": "<user-pubkey>",
  "id": "<event-id>",
  "sig": "<signature>"
}
```

## Usage with Encrypted Messages

When sending encrypted messages (kind 4) within a chat session, clients SHOULD add a `session` tag referencing the session ID:

```json
{
  "kind": 4,
  "content": "c+EFDEGuKqOlkXCshiXMYg==?iv=aWL+ojLSymwCRUI03uulPg==",
  "tags": [
    ["p", "618be242c2e25d3e1b86e5ecabf32929a7c24d6cd2a797e8292a1f6252cb702e"],
    ["session", "b4f9c1f5-7a16-480f-a4e1-07b211269a55"]
  ],
  "created_at": 1761290094
}
```

## Client Behavior

### Creating Sessions

1. When a user has no existing chat sessions, clients SHOULD prompt them to create a new session
2. The default session name SHOULD be "New Chat" if no name is specified
3. Session IDs SHOULD be generated using UUID v4 to ensure uniqueness
4. The `last_edited` tag SHOULD be set to the current Unix timestamp

### Querying Sessions

Clients query for chat sessions using:

```javascript
{
  kinds: [1005],
  authors: [userPubkey]
}
```

### Filtering Messages by Session

To retrieve messages for a specific session, clients should:

1. Query for kind 4 (encrypted DM) events between the relevant users
2. Filter the results to include only messages with a `session` tag matching the active session ID

### Session Management

- Sessions are replaceable events (kind 10000-19999 range)
- Updating a session name or metadata creates a new replaceable event with the same `d` tag
- The `last_edited` tag SHOULD be updated whenever the session is modified
- Clients SHOULD display sessions sorted by `last_edited` timestamp (newest first)

### Deleting Sessions

To delete a chat session, clients SHOULD publish a deletion event (kind 5) according to NIP-09:

```json
{
  "kind": 5,
  "content": "Deleted chat session",
  "tags": [
    ["e", "<session-event-id>"],
    ["k", "1005"]
  ],
  "created_at": 1761290094
}
```

- The `e` tag references the event ID of the session to be deleted
- The `k` tag specifies the kind being deleted (1005)
- Relays that support NIP-09 will hide or remove the deleted session event

## Implementation Notes

- The `d` tag serves as the addressable identifier for replaceable events
- Only the most recent event with a given `pubkey` + `kind` + `d` combination is stored by relays
- Clients can update session metadata by publishing a new event with the same `d` tag value
- Messages without a `session` tag are considered part of a default/unorganized conversation

## Rationale

Chat sessions provide:

1. **Organization**: Users can separate different conversation topics or contexts
2. **Privacy**: Each session can be independently managed and deleted
3. **Context**: Sessions maintain conversation history and metadata
4. **Flexibility**: Users can switch between sessions or manage multiple conversations with the same contact

This approach uses replaceable events to ensure efficient storage while maintaining conversation organization.
