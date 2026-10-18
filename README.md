# Public Pharmacy — Medicine Inventory and Sales

## Requirements
- .NET 8 SDK (or a newer SDK)
- Node.js LTS and npm
- Visual Studio for the API, VS Code for React

## Run the backend
1. Open `PublicPharmacy.Api/PublicPharmacy.Api.csproj` in Visual Studio.
2. Restore packages if prompted.
3. Run the project. Swagger opens if enabled. The API uses `https://localhost:7001` or the URL shown in the console/launch profile.
4. The React app is configured to call `http://localhost:5080`. If your API starts on another port, update `VITE_API_BASE_URL` in `frontend/.env`.

Alternatively, from a terminal:
```bash
cd PublicPharmacy.Api
dotnet restore
dotnet run --urls http://localhost:5080
```

## Run the frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL printed in the terminal (normally http://localhost:5173).

## Features
- List medicines, excluding Notes from the grid
- Search by medicine name
- Add medicine with validation
- Red row when expiry is within the next 30 days (including already-expired medicines)
- Yellow row when quantity is below 10
- Record sales, reject invalid quantities / insufficient stock
- Persist medicines and sales to server-side JSON files in `PublicPharmacy.Api/App_Data`

## API endpoints
- `GET /api/medicines?search=para`
- `GET /api/medicines/{id}`
- `POST /api/medicines`
- `GET /api/sales`
- `POST /api/sales`

JSON files are created automatically. This is suitable for a small assignment/demo, not concurrent production workloads.
