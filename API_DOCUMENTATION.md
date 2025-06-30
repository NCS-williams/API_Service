# Pharmacy Management System API Documentation

## Authentication

The API uses session-based authentication. All protected endpoints require authentication.

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
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "name": null
  }
}
```

#### POST /api/auth/register
Register new user.

**Body:**
```json
{
  "username": "string",
  "password": "string",
  "userType": "user|pharmacy|fournisseur",
  "name": "string (required for pharmacy/fournisseur)",
  "location": "string (required for pharmacy/fournisseur)",
  "phoneNumber": "string (required for pharmacy/fournisseur)"
}
```

#### POST /api/auth/logout
Logout current user.

#### GET /api/auth/me
Get current user information.

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
      "name": "Paracetamol"
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

#### PUT /api/medicines/:id
Update medicine.

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
