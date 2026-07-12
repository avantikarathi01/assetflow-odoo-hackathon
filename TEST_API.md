# Manual API Testing via cURL

You can use the following `curl` commands in your terminal to test the authentication, Role-Based Access Control (RBAC), and domain models. 

> **Important**: Keep the Next.js server running in one terminal (`npm run dev`), and execute these `curl` commands in a second terminal.

---

## 1. Register an Admin Account & Organization
*This creates your Acme organization and logs you in.*
```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@acme.com","password":"password123","firstName":"Admin","lastName":"User","organizationName":"Acme Corporation"}'
```
> 🔑 **Copy the `token` from the response**. You will replace `$TOKEN` with this actual token string in the next requests.

---

## 2. Setup a Location (Admin Only)
*Proves your Admin token works.*
```bash
export TOKEN="paste_your_token_here"

curl -s -X POST http://localhost:4000/api/organizations/locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Headquarters","address":"123 Main St","type":"OFFICE"}'
```
> 📍 **Copy the Location `id`** from the response for the next step.

---

## 3. Setup a Department (Admin Only)
```bash
export LOCATION_ID="paste_location_id_here"

curl -s -X POST http://localhost:4000/api/organizations/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering","code":"ENG","locationId":"'$LOCATION_ID'"}'
```
> 🏢 **Copy the Department `id`** from the response for the next step.

---

## 4. Register an Asset
```bash
export DEPT_ID="paste_dept_id_here"

curl -s -X POST http://localhost:4000/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"MacBook Pro M3","categoryId":"it-equipment","departmentId":"'$DEPT_ID'"}'
```

---

## 5. Check Dashboard KPIs
*This fetches real-time aggregations from the backend.*
```bash
curl -s -X GET http://localhost:4000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Register a Standard Employee (Test RBAC)
*We will register a new user in the same org, who defaults to an `EMPLOYEE` role.*
```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"employee2@acme.com","password":"password123","firstName":"Bob","lastName":"Smith","organizationName":"Acme Corporation"}'
```
> 🔑 **Copy the NEW employee token from the response.**

### Employee trying to create a Department (Should Fail!)
*This proves our `middleware.ts` successfully decodes the JWT, sees the user is NOT an admin, and blocks them with `403 Forbidden`.*
```bash
export EMP_TOKEN="paste_employee_token_here"

curl -s -X POST http://localhost:4000/api/organizations/departments \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rogue Department","code":"ROG","locationId":"'$LOCATION_ID'"}'
```
*(You should see `{"error":"Forbidden: Admin access required"}`).*
