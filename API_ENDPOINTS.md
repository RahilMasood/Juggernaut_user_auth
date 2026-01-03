# API Endpoints Quick Reference

## Complete List of Available Endpoints

### Authentication (5 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | User logout | No |
| POST | `/api/v1/auth/change-password` | Change password | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### Users (6 endpoints)
| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/v1/users` | List users | Yes | - |
| GET | `/api/v1/users/:id` | Get user details | Yes | - |
| GET | `/api/v1/users/:id/permissions` | Get user permissions | Yes | - |
| POST | `/api/v1/users` | Create user | Yes | manage_users |
| PATCH | `/api/v1/users/:id` | Update user | Yes | manage_users |
| DELETE | `/api/v1/users/:id` | Deactivate user | Yes | manage_users |

### Engagements (9 endpoints)
| Method | Endpoint | Description | Auth Required | User Type |
|--------|----------|-------------|---------------|-----------|
| GET | `/api/v1/engagements` | List engagements | Yes | AUDITOR |
| GET | `/api/v1/engagements/:id` | Get engagement | Yes | AUDITOR |
| POST | `/api/v1/engagements` | Create engagement | Yes | AUDITOR (policy check) |
| PATCH | `/api/v1/engagements/:id` | Update engagement | Yes | AUDITOR |
| GET | `/api/v1/engagements/:id/users` | Get engagement team | Yes | AUDITOR |
| POST | `/api/v1/engagements/:id/users` | Add user to engagement | Yes | AUDITOR |
| DELETE | `/api/v1/engagements/:id/users/:userId` | Remove user | Yes | AUDITOR |
| GET | `/api/v1/engagements/:id/confirmations` | List confirmations | Yes | AUDITOR |
| POST | `/api/v1/engagements/:id/confirmations` | Create confirmation | Yes | AUDITOR |

### Confirmations (4 endpoints)
| Method | Endpoint | Description | Auth Required | User Type |
|--------|----------|-------------|---------------|-----------|
| GET | `/api/v1/confirmations/my-confirmations` | My confirmations | Yes | CLIENT, CONFIRMING_PARTY |
| GET | `/api/v1/confirmations/:id` | Get confirmation | Yes | Any (with access) |
| PATCH | `/api/v1/confirmations/:id` | Update confirmation | Yes | AUDITOR |
| POST | `/api/v1/confirmations/:id/respond` | Respond to confirmation | Yes | CLIENT, CONFIRMING_PARTY |

### Clients (5 endpoints) 🆕
| Method | Endpoint | Description | Auth Required | User Type | Permission |
|--------|----------|-------------|---------------|-----------|------------|
| GET | `/api/v1/clients` | List clients | Yes | AUDITOR | - |
| GET | `/api/v1/clients/my-clients` | My clients (as partner/manager) | Yes | AUDITOR | - |
| GET | `/api/v1/clients/:id` | Get client details | Yes | AUDITOR | - |
| POST | `/api/v1/clients` | Create client | Yes | AUDITOR | Policy check |
| PATCH | `/api/v1/clients/:id` | Update client | Yes | AUDITOR | Policy check |

### Independence (7 endpoints) 🆕
| Method | Endpoint | Description | Auth Required | User Type | Access |
|--------|----------|-------------|---------------|-----------|--------|
| GET | `/api/v1/independence/my-declarations` | My declarations | Yes | AUDITOR | Own |
| GET | `/api/v1/independence/my-engagements` | Engagements (as partner/manager) | Yes | AUDITOR | Partner/Manager |
| GET | `/api/v1/independence/:id` | Get declaration | Yes | AUDITOR | Own/Partner/Manager |
| POST | `/api/v1/independence/:id/submit` | Submit declaration | Yes | AUDITOR | Own |
| PATCH | `/api/v1/independence/:id/review` | Review declaration | Yes | AUDITOR | Partner/Manager |
| POST | `/api/v1/independence/engagements/:engagementId/add-user` | Add user for declaration | Yes | AUDITOR | Partner/Manager |
| GET | `/api/v1/independence/engagements/:engagementId/declarations` | List engagement declarations | Yes | AUDITOR | Partner/Manager |

### Webhooks (1 endpoint)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/webhooks/payroll-sync` | Payroll sync webhook | HMAC signature |

### Health (1 endpoint)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |

---

## Total Endpoints: 38

- **Authentication:** 5
- **Users:** 6
- **Engagements:** 9
- **Confirmations:** 4
- **Clients:** 5 🆕
- **Independence:** 7 🆕
- **Webhooks:** 1
- **Health:** 1

---

## New Endpoints Added

### Client Onboarding Tool (5 endpoints)
Enables authorized users to onboard clients with designated partners, managers, and optional review partners.

### Independence Tool (7 endpoints)
Provides comprehensive independence declaration management with partner/manager oversight and SharePoint integration.

---

## Quick Access by Feature

### For Auditors
- Authentication: `/api/v1/auth/*`
- Engagements: `/api/v1/engagements/*`
- Confirmations: `/api/v1/confirmations/*`
- Clients: `/api/v1/clients/*` 🆕
- Independence: `/api/v1/independence/*` 🆕

### For Clients & Confirming Parties
- Authentication: `/api/v1/auth/*`
- Confirmations: `/api/v1/confirmations/my-confirmations`
- Respond: `/api/v1/confirmations/:id/respond`

### For Partners & Managers
- All Auditor endpoints
- My Clients: `/api/v1/clients/my-clients`
- My Engagements: `/api/v1/independence/my-engagements`
- Add Users for Independence: `/api/v1/independence/engagements/:engagementId/add-user`
- Review Declarations: `/api/v1/independence/:id/review`

---

## Documentation Files

- **README.md** - Complete API documentation with request/response examples
- **NEW_FEATURES.md** - Detailed documentation for Client Onboarding and Independence Tool
- **COMPLETE.md** - Quick reference and project structure
- **PROJECT_SUMMARY.md** - Implementation overview
- **API_ENDPOINTS.md** - This file

---

For detailed request/response examples, see **README.md** and **NEW_FEATURES.md**.

