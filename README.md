# ServerOps - Windows Server Inventory Console

ServerOps is a React + Express + MS SQL Server application designed to manage, search, filter, and audit domain servers, operating system lifecycles, and location master data. This application supports very large datasets containing hundreds of thousands of records by utilizing server-side pagination, parameterized filters, whitelisted sorting, and SQL-level statistic aggregation.

---

## 1. Project Setup & Local Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server/) (Local DB or network-accessible instance)

### Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### Running Locally
Run the React frontend (Vite) and Node.js Express API server concurrently:
```bash
npm run dev
```
- The frontend will be hosted on: `http://localhost:8080`
- The backend API runs on: `http://localhost:5000` (requests to `/api/*` are proxied automatically by Vite)

---

## 2. Database Configuration & Schema Setup

### Environment Variables
Configure your database credentials by creating or editing the `.env` file in the root directory:
```env
DB_USER=sa
DB_PASSWORD=StrongPassword@123
DB_SERVER=localhost
DB_DATABASE=ServerInventory
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### Schema & Database Setup
1. Connect to your SQL Server instance using **SQL Server Management Studio (SSMS)** or your preferred CLI.
2. Create the target database:
   ```sql
   CREATE DATABASE ServerInventory;
   ```
3. Open and execute the [db_schema.sql](file:///c:/workarea/git/remix-of-server-scout/db_schema.sql) file to create the tables, relationships, indexes, and views:
   - `dbo.MASTERLocations`: Locations master list (joined for location metadata).
   - `dbo.MASTEROS`: Operating Systems catalog (support dates and compatibility).
   - `dbo.SupportGroups`: Support groups metadata (assignees and emails).
   - `dbo.MasterRecords`: General details (static server properties).
   - `dbo.xSummary`: Summary details (dynamic metrics and patching states).
   - `dbo.DetailAllServers`: A flat database view performing a left join across the above tables to serve paginated server inventory sheets.
4. Execute the [db_seed.sql](file:///c:/workarea/git/remix-of-server-scout/db_seed.sql) script to insert initial records for locations, OS catalog versions, support groups, and server fleet details.

---

## 3. Production Build & Deployment

### Build Process
Compile the React application for production output:
```bash
npm run build
```
This outputs static, optimized bundle assets into the `dist/` directory.

### Express Hosting (Production)
In a production deployment, the Express server (`server.js`) can serve these compiled frontend files statically. Simply ensure that the backend is deployed with the correct environment variables and directory mappings.

To test the compiled assets locally using the Express server:
```bash
npm run server
```

---

## 4. Migration Notes (Supabase to Microsoft SQL Server)
1. **Removed Client-Side Direct Querying**: Removed `@supabase/supabase-js` dependencies and integration clients. The frontend React stores (`serverStore` and `mastersStore`) now fetch JSON data over standard HTTP endpoints (`/api/servers`, `/api/locations`, etc.).
2. **Server-Side Operations**: Search, sorting, multi-filtering, and pagination are now done on the database level using parameterized T-SQL requests (utilizing `OFFSET ... FETCH NEXT ... ROWS ONLY`) to support hundreds of thousands of server assets.
3. **Cascading Writes**: Deleting or updating a server's name propagates across relational tables in a secure SQL Server transaction using connection pooling.
