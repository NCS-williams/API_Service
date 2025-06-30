# Pharmacy Management System API Documentation

## Authentication

The API uses database-stored session authentication with support for both cookies and headers. Sessions are stored in the database and expire after 24 hours.

### Session Management
The API supports multiple authentication methods:
1. **HTTP Cookies** (Recommended): Session ID is automatically set as an httpOnly cookie on login
2. **Authorization Header**: `Bearer <sessionId>`
3. **Custom Header**: `x-session-id: <sessionId>`

### Auth Endpoints

#### POST /api/auth/login
Login for all user types.

**Body:**
```json
{
  "username": "string",
  "password": "string",
  "userType": "user|pharmacy|fournisseur"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "sessionId": "uuid-session-id",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "name": null
  }
}
```

**Cookie:** The session ID is automatically set as an httpOnly cookie named `sessionId`

**Important:** 
- If using cookies (recommended), no additional setup is required - the cookie will be sent automatically
- If not using cookies, store the `sessionId` from the response and include it in subsequent requests

#### Authentication Methods
For all protected endpoints, authentication can be provided via:
1. **Cookie** (automatic): `sessionId` cookie
2. **Authorization Header:** `Bearer <sessionId>`
3. **Custom Header:** `x-session-id: <sessionId>`

#### POST /api/auth/logout
Logout current user, destroy session, and clear cookies.

**Authentication:** Required (any method)
**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /api/auth/me
Get current user information.

**Authentication:** Required (any method)

#### GET /api/auth/sessions
Get all active sessions (admin/debug endpoint).

**Authentication:** Required (pharmacy role only)
**Response:**
```json
{
  "success": true,
  "count": 3,
  "sessions": [
    {
      "sessionId": "uuid-session-id",
      "userId": 1,
      "userType": "pharmacy",
      "user": {
        "id": 1,
        "username": "pharmacy1",
        "role": "pharmacy",
        "name": "Main Pharmacy"
      },
      "createdAt": "2024-01-01T12:00:00.000Z",
      "expiresAt": "2024-01-02T12:00:00.000Z"
    }
  ]
}
```

## Users (Role: any authenticated user)

#### GET /api/users
Get all users (excludes passwords).

#### GET /api/users/:id
Get user by ID.

#### POST /api/users
Create new user.

#### PUT /api/users/:id
Update user (own profile or admin).

#### DELETE /api/users/:id
Delete user (own profile or admin).

## Medicines (Role: any authenticated user)

#### GET /api/medicines
Get all medicines.

#### GET /api/medicines/search?name=searchTerm
Search medicines by name (case-insensitive, partial matches).

**Query Parameters:**
- `name` (required): Search term for medicine name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paracetamol",
      "price": "5.99"
    }
  ],
  "searchTerm": "para",
  "count": 1
}
```

#### GET /api/medicines/:id
Get medicine by ID.

#### POST /api/medicines
Create new medicine.

**Body:**
```json
{
  "name": "string",
  "price": 15.99
}
```

#### PUT /api/medicines/:id
Update medicine.

**Body:**
```json
{
  "name": "string (optional)",
  "price": 15.99 (optional)
}
```

#### DELETE /api/medicines/:id
Delete medicine.

## Pharmacy (Role: any authenticated user)

#### GET /api/pharmacy
Get all pharmacies (excludes passwords).

#### GET /api/pharmacy/:id
Get pharmacy by ID.

#### PUT /api/pharmacy/:id
Update pharmacy (own profile only for pharmacy role).

#### DELETE /api/pharmacy/:id
Delete pharmacy (own profile only for pharmacy role).

**Note:** Pharmacy registration is handled through `/api/auth/register` with `userType: "pharmacy"`

## Fournisseur (Role: any authenticated user)

#### GET /api/fournisseur
Get all fournisseurs (excludes passwords).

#### GET /api/fournisseur/:id
Get fournisseur by ID.

#### PUT /api/fournisseur/:id
Update fournisseur (own profile only for fournisseur role).

#### DELETE /api/fournisseur/:id
Delete fournisseur (own profile only for fournisseur role).

**Note:** Fournisseur registration is handled through `/api/auth/register` with `userType: "fournisseur"`

## Commands

### GET /api/commands
Get all commands with filters.
- **Role:** Any authenticated user
- **Filters:** state, pharmId, fournisseurId
- **Auto-filtering:** Pharmacy users see only their commands, Fournisseur users see only their assigned commands

### GET /api/commands/pending
Get pending commands (state: awaiting).
- **Role:** fournisseur only

### GET /api/commands/:id
Get command by ID.
- **Role:** Any authenticated user with access rights

### POST /api/commands
Create new command.
- **Role:** pharmacy only
- **Body:**
```json
{
  "medId": 1,
  "numOfUnits": 100
}
```

### PATCH /api/commands/:id/accept
Accept command (fournisseur confirms order).
- **Role:** fournisseur only
- **Effect:** Sets fournisseurId and changes state to 'on_delivery'

### PATCH /api/commands/:id/deliver
Mark command as delivered.
- **Role:** fournisseur only (must be assigned to the command)
- **Effect:** Changes state to 'delivered'

### PUT /api/commands/:id
Update command (limited to numOfUnits, only if state is 'awaiting').
- **Role:** pharmacy only (own commands)

### DELETE /api/commands/:id
Delete command (only if state is 'awaiting').
- **Role:** pharmacy only (own commands)

## Stocks

### GET /api/stocks
Get all stocks with filters.
- **Role:** Any authenticated user
- **Filters:** pharmId
- **Auto-filtering:** Pharmacy users see only their stocks

### GET /api/stocks/by-medicine/:medicineId
Get all stocks for a specific medicine (shows which pharmacies have this medicine).
- **Role:** Any authenticated user
- **Returns:** All pharmacies that have the medicine in stock (numOfUnits > 0)
- **Ordered by:** Highest stock quantity first

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pharmId": 1,
      "medicalId": 1,
      "numOfUnits": 50,
      "medicine": {
        "id": 1,
        "name": "Paracetamol",
        "price": "5.99"
      },
      "pharmacy": {
        "id": 1,
        "username": "pharma_central",
        "name": "Central Pharmacy",
        "location": "Downtown",
        "phoneNumber": "+1234567890"
      }
    }
  ],
  "medicine": {
    "id": 1,
    "name": "Paracetamol",
    "price": "5.99"
  },
  "totalPharmacies": 1,
  "totalUnits": 50
}
```

### GET /api/stocks/:id
Get stock by ID.
- **Role:** Any authenticated user with access rights

### POST /api/stocks
Create new stock.
- **Role:** pharmacy only
- **Body:**
```json
{
  "medicalId": 1,
  "numOfUnits": 50
}
```

### PUT /api/stocks/:id
Update stock.
- **Role:** pharmacy only (own stocks)

### PATCH /api/stocks/:id/add
Add units to stock.
- **Role:** pharmacy only (own stocks)
- **Body:**
```json
{
  "units": 25
}
```

### PATCH /api/stocks/:id/remove
Remove units from stock.
- **Role:** pharmacy only (own stocks)
- **Body:**
```json
{
  "units": 10
}
```

### DELETE /api/stocks/:id
Delete stock.
- **Role:** pharmacy only (own stocks)

## Demands

### GET /api/demands
Get all demands with filters.
- **Role:** Any authenticated user
- **Filters:** userId
- **Auto-filtering:** Regular users see only their demands

### GET /api/demands/:id
Get demand by ID.
- **Role:** Any authenticated user with access rights

### POST /api/demands
Create new demand.
- **Role:** user only
- **Body:**
```json
{
  "medId": 1
}
```

### PUT /api/demands/:id
Update demand.
- **Role:** user only (own demands)

### DELETE /api/demands/:id
Delete demand.
- **Role:** user only (own demands)

## Command Workflow

1. **Pharmacy creates command:**
   - POST /api/commands
   - State: 'awaiting'
   - FournisseurId: null

2. **Fournisseur views pending commands:**
   - GET /api/commands/pending

3. **Fournisseur accepts command:**
   - PATCH /api/commands/:id/accept
   - State changes to: 'on_delivery'
   - FournisseurId set

4. **Fournisseur marks as delivered:**
   - PATCH /api/commands/:id/deliver
   - State changes to: 'delivered'

## Sample Users for Testing

- **User:** username: `john_doe`, password: `password123`
- **Pharmacy:** username: `pharma_central`, password: `pharma123`
- **Fournisseur:** username: `med_supplier1`, password: `supplier123`

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
