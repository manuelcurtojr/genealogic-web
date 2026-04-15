---
name: clean-dogs
description: Delete dogs from the Genealogic database by name pattern, user, kennel, or import batch. Use when you need to "delete dogs", "clean up", "remove perros", "undo import", "delete all dogs from X", or any bulk dog deletion task. Handles all cascading references automatically.
---

# Clean Dogs — Genealogic Database Cleanup

Safely delete dogs and all their related data from the Genealogic database.

## Connection

Read Supabase credentials from `.env.local`:
```javascript
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

Or hardcode from .env.local if running as a standalone script.

## Finding dogs to delete

The user might specify dogs by:
- **Name pattern**: `ilike('name', '%irema curt%')`
- **User/owner**: `eq('owner_id', userId)` or `eq('contributor_id', userId)`
- **Kennel**: `eq('kennel_id', kennelId)`
- **Recent imports**: Check `notifications` table with `type: 'import'`, parse `createdIds` from message JSON
- **Date range**: `gte('created_at', date)`
- **No owner**: `is('owner_id', null).is('contributor_id', null)`

Always show the user what will be deleted BEFORE deleting, including count and sample names.

## Deletion sequence (order matters!)

For each dog ID:

```javascript
// 1. Unlink parent references (other dogs pointing to this one)
await sb.from('dogs').update({ father_id: null }).eq('father_id', dogId);
await sb.from('dogs').update({ mother_id: null }).eq('mother_id', dogId);

// 2. Delete related records
await sb.from('dog_photos').delete().eq('dog_id', dogId);
await sb.from('favorites').delete().eq('dog_id', dogId);
await sb.from('vet_records').delete().eq('dog_id', dogId);
await sb.from('awards').delete().eq('dog_id', dogId);
await sb.from('dog_changes').delete().eq('dog_id', dogId);

// 3. Delete the dog
await sb.from('dogs').delete().eq('id', dogId);
```

## Also clean up

- **Notifications**: Delete import notifications if undoing an import
- **Kennels**: If deleting all dogs from a kennel, ask if the kennel should be deleted too
- **User profiles**: If deleting a demo user, also delete profile and auth user:
  ```javascript
  await sb.from('profiles').delete().eq('id', userId);
  await sb.auth.admin.deleteUser(userId);
  ```

## Safety

- Always confirm with the user before deleting
- Show count and sample names first
- Never delete dogs that have external references (other users' dogs as children) without warning
- Log what was deleted for audit
