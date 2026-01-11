# Engagement Default Logic

## Overview

This document explains how the default engagement system works for client onboarding and engagement management.

## How It Works

### 1. Client Onboarding (Page 2)

When a client is created:
- ✅ **Audit Client** is created
- ✅ **Default Engagement** is created with `is_default: true`
- ✅ **Partner and Manager** are assigned to this default engagement with roles:
  - `engagement_partner`
  - `engagement_manager`

**Important**: This default engagement is a **placeholder** that will be used/replaced when the first real engagement is created.

### 2. Engagement Management (Page 3)

When creating engagements:

#### First Engagement (Replaces Default)
- ✅ System checks if a default engagement exists for the client
- ✅ If found, the default engagement is **updated** (not deleted):
  - `is_default` flag is set to `false`
  - The same `engagement_id` is kept
- ✅ Partner and manager from the default engagement are automatically assigned

#### Subsequent Engagements
- ✅ New engagement is created with `is_default: false`
- ✅ Partner and manager are **automatically copied** from the first engagement (or any previous engagement)
- ✅ Same partner and manager are assigned to ALL engagements for that client

## Database Schema

### Engagement Model
```javascript
{
  id: UUID (primary key),
  audit_client_id: UUID (foreign key),
  status: ENUM('Active', 'Archived'),
  is_default: BOOLEAN (default: false) // NEW FIELD
}
```

### EngagementUser (Assignment)
```javascript
{
  engagement_id: UUID,
  user_id: UUID,
  role: ENUM('engagement_partner', 'engagement_manager', ...)
}
```

## Key Features

1. **Default Engagement**: Created during client onboarding, marked with `is_default: true`
2. **First Engagement**: Replaces the default engagement (keeps same ID, removes default flag)
3. **Auto-Assignment**: Partner and manager are automatically assigned to all new engagements
4. **Consistency**: Same partner and manager for all engagements of a client

## API Behavior

### List Engagements
- Default engagements (`is_default: true`) are **excluded** from the list
- Only real engagements are shown

### Get Engagement by ID
- Default engagements can still be accessed by ID if needed
- They will be converted to real engagements when first engagement is created

## Migration

Run the migration to add the `is_default` field:

```bash
npm run migrate-add-is-default
```

Or manually:
```bash
node migrations/migrate-add-is-default.js
```

## Example Flow

1. **Client Onboarding**:
   ```
   Client: "ABC Corp"
   → Default Engagement created (is_default: true)
   → Partner: User A (engagement_partner)
   → Manager: User B (engagement_manager)
   ```

2. **First Engagement Creation**:
   ```
   Engagement Management: Create first engagement
   → Default engagement updated (is_default: false)
   → Same engagement_id kept
   → Partner: User A (auto-assigned)
   → Manager: User B (auto-assigned)
   ```

3. **Second Engagement Creation**:
   ```
   Engagement Management: Create second engagement
   → New engagement created (is_default: false)
   → Partner: User A (copied from first engagement)
   → Manager: User B (copied from first engagement)
   ```

## Benefits

- ✅ **No orphaned engagements**: Default engagement is reused, not deleted
- ✅ **Consistent assignments**: Same partner/manager for all engagements
- ✅ **Clean separation**: Default engagements hidden from lists
- ✅ **Backward compatible**: Existing engagements work as before

