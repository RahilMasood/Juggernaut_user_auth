# Default Password System

## Overview

The Audit Confirmation API automatically generates secure temporary passwords for newly created users who don't have a password set during creation. This ensures users can log in for the first time while maintaining security through forced password changes.

## How It Works

### 1. User Creation Flow

When a user is created via the `POST /api/v1/users` endpoint without providing a password:

1. **Password Generation**: The system generates a secure random password using the `generatePassword()` utility
2. **Email Notification**: Credentials are automatically sent to the user's email address
3. **Forced Password Change**: The `must_change_password` flag is set to `true`
4. **Response Indication**: The API response indicates whether credentials were sent

### 2. Password Generation

The generated passwords are cryptographically secure and meet the following requirements:

- **Length**: 16 characters
- **Complexity**: 
  - At least 1 lowercase letter (a-z)
  - At least 1 uppercase letter (A-Z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- **Randomness**: Uses Node.js `crypto.randomInt()` for cryptographic randomness

Example generated password: `K9#mP2qL!xZ5wA7t`

### 3. Email Notification

The credentials email includes:

- **Login URL**: Appropriate portal URL based on user type
- **Username**: User's email address
- **Temporary Password**: The generated password
- **Important Notice**: Reminder about password change requirement

### 4. Portal URLs by User Type

The system uses different portal URLs based on the user type:

| User Type | Environment Variable | Fallback |
|-----------|---------------------|----------|
| `AUDITOR` | `AUDITOR_PORTAL_URL` or `PORTAL_URL` | `http://localhost:3000` |
| `CLIENT` | `CLIENT_PORTAL_URL` or `PORTAL_URL` | `http://localhost:3000` |
| `CONFIRMING_PARTY` | `CONFIRMING_PARTY_PORTAL_URL` or `PORTAL_URL` | `http://localhost:3000` |

## API Examples

### Creating a User Without Password

**Request:**
```http
POST /api/v1/users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "john.doe@firm.com",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "AUDITOR",
  "firm_id": "550e8400-e29b-41d4-a716-446655440000",
  "designation": "Senior Auditor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@firm.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "AUDITOR",
      "designation": "Senior Auditor",
      "is_active": true,
      "must_change_password": true,
      "firm_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    "credentialsSent": true,
    "message": "User created successfully. Login credentials have been sent via email."
  }
}
```

### First-Time Login

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@firm.com",
  "password": "K9#mP2qL!xZ5wA7t"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "mustChangePassword": true
  }
}
```

**Note**: The `mustChangePassword: true` flag indicates the frontend should redirect to password change page.

### Changing Password After First Login

**Request:**
```http
POST /api/v1/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "old_password": "K9#mP2qL!xZ5wA7t",
  "new_password": "MyNewSecure123!Password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully. Please login again."
  }
}
```

After password change:
- `must_change_password` is set to `false`
- All refresh tokens are revoked (forces re-login)
- Password change is logged in audit logs

## Configuration

### Environment Variables

Configure the following environment variables in your `.env` file:

```bash
# Email Configuration (Required for sending credentials)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@yourfirm.com

# Portal URLs (Optional - defaults to localhost:3000)
AUDITOR_PORTAL_URL=https://auditor.yourfirm.com
CLIENT_PORTAL_URL=https://client.yourfirm.com
CONFIRMING_PARTY_PORTAL_URL=https://confirm.yourfirm.com

# Or use a single portal URL for all user types
PORTAL_URL=https://portal.yourfirm.com
```

### Email Template Customization

The credentials email template can be customized in `src/config/email.js`:

```javascript
credentialsEmail: {
  subject: 'Login Credentials for Audit Confirmation Portal',
  getHtml: (data) => `
    // Customize HTML template here
    // Available data: name, email, temporaryPassword, engagementName, firmName, portalUrl
  `
}
```

## Security Considerations

### Password Strength

The generated passwords meet industry-standard security requirements:
- Entropy: ~95 bits (using 77-character alphabet)
- Brute force resistance: ~10^28 combinations
- Meets NIST 800-63B guidelines for randomly generated passwords

### Password Storage

- Passwords are hashed using bcrypt (cost factor 10) before storage
- Original temporary password is never stored in the database
- Only returned in the API response and email (not logged)

### Password Change Enforcement

- `must_change_password` flag is checked during login
- Frontend should redirect users to password change page
- User cannot perform other actions until password is changed

### Account Security

- Failed login attempts are tracked
- Accounts are locked after 5 failed attempts (configurable)
- All password changes are logged in audit logs

## Troubleshooting

### Email Not Sent

If users don't receive the credentials email:

1. **Check SMTP Configuration**: Verify environment variables are set correctly
2. **Check Logs**: Look for email errors in application logs:
   ```bash
   docker compose logs -f api | grep "credentials email"
   ```
3. **Test SMTP Connection**: Use the email service directly to test
4. **Fallback Option**: The temporary password is returned in the API response (only visible to the admin creating the user)

### Email Delivery Issues

- **Spam Folder**: Users should check spam/junk folders
- **Email Filtering**: Corporate email filters may block automated emails
- **Whitelisting**: Add sender email to organization whitelist

### Manual Password Reset

If a user loses their temporary password before changing it:

1. Admin can create a password reset request (if implemented)
2. Admin can deactivate and recreate the user account
3. Alternatively, implement a password reset feature

## Integration with Other Services

### Payroll System Sync

When users are synced from a payroll system (`syncUsersFromPayroll`), they also receive temporary passwords:

- Password is generated automatically
- `must_change_password` is set to `true`
- Currently, emails are NOT sent for bulk imports (to avoid spam)
- Consider implementing batch email sending or alternative notification method

### Confirmation Service

When external parties (clients/confirming parties) are added through confirmations:

- Same password generation and email flow applies
- Engagement-specific information is included in the email
- Portal URLs are selected based on party type

## Best Practices

### For Administrators

1. **Verify Email Configuration**: Test email sending before creating users
2. **Inform Users**: Let users know they'll receive credentials via email
3. **Monitor Audit Logs**: Track user creation and password changes
4. **Secure Response**: Don't log or store the API response containing temporary passwords

### For Frontend Developers

1. **Handle `mustChangePassword` Flag**: Redirect to password change page after login
2. **Show Clear Instructions**: Guide users through password change process
3. **Password Requirements**: Display password requirements clearly
4. **Error Handling**: Handle expired/invalid temporary passwords gracefully

### For Users

1. **Check Email**: Look for credentials email immediately after account creation
2. **Change Password Promptly**: Change temporary password on first login
3. **Use Strong Password**: Choose a strong, unique password
4. **Report Issues**: Contact support if credentials email not received

## Future Enhancements

Potential improvements to consider:

- [ ] Password expiry for temporary passwords (e.g., expire after 24 hours)
- [ ] Option to send credentials via SMS
- [ ] Batch email sending for payroll sync
- [ ] Self-service password reset flow
- [ ] Admin portal to view/resend temporary passwords
- [ ] Configurable password complexity requirements
- [ ] Multi-factor authentication support
- [ ] Password history tracking (prevent reuse)

## Related Documentation

- [Authentication Guide](../README.md#authentication-endpoints)
- [Email Configuration](../COMPLETE.md#email-configuration)
- [Security Best Practices](../COMPLETE.md#security-considerations)
- [API Testing Guide](../COMPLETE_API_TEST_GUIDE.md)

