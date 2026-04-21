# User State Management System

## Overview

The SUBSTATE platform implements a comprehensive 8-state user management system that tracks both subscription plans and account statuses. This system provides granular control over user access and billing states.

## User States

### Subscription Plans (3 States)
1. **TRIAL** - New users with 14-day trial access
2. **PROFESSIONAL** - Paid professional plan users  
3. **ENTERPRISE** - Paid enterprise plan users

### Account Status (5 States)
1. **ACTIVE** - Normal active users with full access
2. **EXPIRED** - Users whose subscription has expired
3. **CANCELLED** - Users who cancelled their subscription
4. **SUSPENDED** - Admin-suspended accounts (subscription paused)
5. **LOCKED** - Completely locked accounts (security/violations)

## State Priority Logic

The system uses a priority-based approach to determine the displayed user state:

```javascript
Priority Order:
1. LOCKED (accountLocked = true OR subscriptionStatus = 'LOCKED')
2. SUSPENDED (subscriptionStatus = 'SUSPENDED') 
3. EXPIRED (subscriptionStatus = 'EXPIRED')
4. CANCELLED (subscriptionStatus = 'CANCELLED')
5. UNVERIFIED (!emailVerified)
6. Active Subscription Plan (TRIAL/PROFESSIONAL/ENTERPRISE)
```

## Database Schema

### User Model Updates
```javascript
subscription: {
  type: String,
  enum: ['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'],
  default: 'TRIAL'
}

subscriptionStatus: {
  type: String,
  enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'LOCKED'],
  default: 'ACTIVE'
}

accountLocked: Boolean
lockReason: String
lockedUntil: Date
```

## Admin Actions

### Available Actions
- **View** - View user details
- **Lock/Unlock** - Completely lock/unlock account access
- **Suspend/Reactivate** - Suspend/reactivate subscription only
- **Expire** - Mark subscription as expired
- **Cancel** - Mark subscription as cancelled

### Action Effects

| Action | accountLocked | subscriptionStatus | Access Level |
|--------|---------------|-------------------|--------------|
| Lock | true | LOCKED | No access |
| Unlock | false | ACTIVE | Full access |
| Suspend | false | SUSPENDED | Limited access |
| Reactivate | false | ACTIVE | Full access |
| Expire | false | EXPIRED | Limited access |
| Cancel | false | CANCELLED | Limited access |

## Visual Design

### State Colors & Icons
```javascript
const userStates = [
  { state: 'TRIAL', color: '#3b82f6', icon: 'Clock' },
  { state: 'PROFESSIONAL', color: '#f59e0b', icon: 'Star' },
  { state: 'ENTERPRISE', color: '#8b5cf6', icon: 'Crown' },
  { state: 'ACTIVE', color: '#10b981', icon: 'CheckCircle' },
  { state: 'EXPIRED', color: '#ef4444', icon: 'XCircle' },
  { state: 'CANCELLED', color: '#6b7280', icon: 'Minus' },
  { state: 'SUSPENDED', color: '#f59e0b', icon: 'AlertTriangle' },
  { state: 'LOCKED', color: '#dc2626', icon: 'Lock' }
]
```

## Admin Interface Features

### User Management Table
- **Subscription Plan** - Shows TRIAL/PROFESSIONAL/ENTERPRISE
- **Account Status** - Shows ACTIVE/EXPIRED/CANCELLED/SUSPENDED/LOCKED
- **User State** - Shows the effective state based on priority logic
- **Actions** - Context-sensitive action buttons

### Filtering Options
```javascript
// Subscription Plans
- Trial Users
- Professional Plan  
- Enterprise Plan

// Account Status
- Active Users
- Expired Subscriptions
- Cancelled Subscriptions
- Suspended Accounts
- Locked Accounts
```

### Statistics Dashboard
- User state distribution charts
- Real-time counts for each state
- Recent user activity with state indicators

## API Endpoints

### Get Users with Filtering
```
GET /admin/users?subscription=TRIAL&status=ACTIVE
GET /admin/users?status=LOCKED
GET /admin/users?subscription=PROFESSIONAL
```

### User Actions
```
PATCH /admin/users/:userId
Body: { action: 'suspend' | 'activate' | 'reactivate' | 'expire' | 'cancel' }
```

## Admin Users

Admin users are completely above the subscription system and have unlimited access to all features.

### Admin Privileges
- **Unlimited Access**: No subscription limits or restrictions
- **No Subscription Required**: Admin users don't need TRIAL/PROFESSIONAL/ENTERPRISE subscriptions
- **Cannot be Modified**: Admin users cannot be suspended, locked, or have their access restricted
- **Always Active**: Admin accounts are always in ACTIVE status
- **Zero Risk**: Admin users have 0 risk score and no violations

### Admin User Identification
- **Role**: `role: 'ADMIN'` in the database
- **Visual Indicator**: 👑 ADMIN badge in the interface
- **Subscription Display**: Shows "ADMIN ACCESS" instead of subscription type

### Admin vs Protected Users
- **Admin Users**: Above the subscription system entirely (unlimited access)
- **Protected Users**: Regular users who cannot be suspended/locked but still have subscription limits

### Current Admin Users
- **barotashokbhai03044@gmail.com** - Full admin access (unlimited everything)

### Implementation
```javascript
// Check if user is admin
if (user.role === 'ADMIN') {
  // Unlimited access - no subscription checks needed
  return true;
}

// Admin users in migration
if (user.role === 'ADMIN') {
  // Don't assign subscription types - they don't need them
  subscriptionStatus: 'ACTIVE' // Always active
}
```

## Protected Users

The system includes protection for critical accounts that should never be suspended or locked:

### Protected Accounts (Non-Admin)
- **barotharshil070@gmail.com** - Active user (gets PROFESSIONAL subscription but cannot be suspended)

### Protection Features
- **Migration Protection**: Protected users are automatically assigned ACTIVE status and premium subscriptions
- **Admin Interface Protection**: Action buttons are disabled for harmful actions on protected users
- **API Protection**: Backend prevents suspend/lock actions on protected accounts
- **Visual Indicators**: Protected users show a 🛡️ PROTECTED badge in the admin interface
- **Zero Risk Score**: Protected users are assigned 0 risk score and no violations

### Protection Logic
```javascript
// In migration script
if (PROTECTED_USERS.includes(user.email.toLowerCase())) {
  console.log(`🛡️  Protected user: ${user.email} - ensuring ACTIVE status`);
  return 'ACTIVE';
}

// In admin API
if (PROTECTED_USERS.includes(user.email.toLowerCase())) {
  if (['suspend', 'suspend-subscription', 'expire', 'cancel'].includes(action)) {
    return res.status(403).json({ 
      error: `Cannot ${action} protected user: ${user.email}` 
    });
  }
}
```

## Migration Process

### For Existing Databases (500+ Users)

If you already have users in your database, use the migration scripts to intelligently assign states:
```bash
npm run check-user-stats
```
This shows your current user distribution and helps plan the migration.

#### 2. Safe Migration (Recommended)
```bash
npm run safe-migrate-users
```
This interactive script will:
- Create a backup of your existing users
- Ask for confirmation before proceeding
- Migrate all users to the new state system
- Provide detailed statistics

#### 3. Manual Migration Steps
```bash
# Step 1: Create backup
npm run backup-users

# Step 2: Run migration
npm run migrate-existing-users
```

### Migration Logic

The migration script uses intelligent algorithms to assign realistic states:

#### Risk-Based Assignment
- **High Risk Users** (80+ score) → LOCKED/SUSPENDED
- **Medium Risk Users** (60+ score) → SUSPENDED/EXPIRED
- **Low Risk Users** → Normal distribution

#### Risk Factors
- High article count (>200 articles)
- Long inactivity (>60 days since login)
- High campaign count (>50 campaigns)
- Unverified old accounts (>30 days unverified)
- Existing violation history

#### Realistic Distribution
- **TRIAL**: 45% (most new users)
- **PROFESSIONAL**: 40% (main paid tier)
- **ENTERPRISE**: 15% (premium tier)

Within each subscription:
- **ACTIVE**: 75% (most users active)
- **EXPIRED**: 12% (some expired)
- **CANCELLED**: 8% (some cancelled)
- **SUSPENDED**: 3% (few violations)
- **LOCKED**: 2% (serious violations)

### For New Databases

If starting fresh, use the sample data script:

```bash
npm run populate-user-states
```

This creates 12 sample users covering all state combinations.

## Implementation Files

### Backend
- `backend/models/User.js` - Updated user schema
- `backend/routes/admin.js` - Admin API endpoints
- `scripts/populate-user-states.js` - Sample data script

### Frontend  
- `src/pages/admin/Admin.jsx` - Admin interface
- `src/styles/admin.css` - State styling
- User state management functions and components

## Security Considerations

1. **LOCKED** accounts have complete access denial
2. **SUSPENDED** accounts maintain login but limited features
3. Admin actions are logged and auditable
4. State transitions follow business logic rules
5. Email verification is tracked separately from subscription status

## Future Enhancements

1. **Automated State Transitions** - Cron jobs for expiration
2. **State History Tracking** - Audit trail of state changes
3. **Bulk Actions** - Mass state updates
4. **Custom Lock Reasons** - Detailed violation tracking
5. **Grace Periods** - Configurable transition delays

## Testing

The system includes comprehensive test users that demonstrate:
- All 8 possible states
- Edge cases (unverified emails, violations)
- Realistic usage patterns
- Admin action scenarios

This provides a robust foundation for testing user management workflows and ensuring proper state handling across the platform.