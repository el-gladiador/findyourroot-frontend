# Authentication Setup

The frontend now requires authentication and authorization before accessing the family tree application.

## Features

- **JWT-based authentication** - Secure token-based authentication
- **Protected routes** - All pages require authentication
- **Auto token validation** - Validates stored tokens on app load
- **Logout functionality** - Sign out from the settings tab
- **API integration** - All family tree operations connect to backend API

## Default Admin Credentials

**Email:** `mohammadamiri.py@gmail.com`  
**Password:** `Klgzu7.RpoG!`

## How It Works

### Authentication Flow

1. **App Load** → Validates stored JWT token
2. **Token Invalid/Missing** → Shows login page
3. **Login Success** → Fetches family data from backend
4. **All Operations** → Require valid JWT token

### Protected Operations

- View family tree
- Search relatives
- Add/edit/delete persons
- Export data

### Components

- **`/lib/api.ts`** - API client with authentication
- **`/lib/store.ts`** - Auth state management with Zustand
- **`/components/LoginPage.tsx`** - Login UI
- **`/app/page.tsx`** - Protected route wrapper

## Testing Authentication

### 1. Start the Backend

```bash
cd backend
./start.sh
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Login

- Navigate to `http://localhost:3000`
- You'll be redirected to the login page
- Enter admin credentials
- Access granted to family tree

### 4. Test Logout

- Go to Settings tab
- Click "Sign Out" button
- Returns to login page

## API Configuration

The frontend connects to the backend via environment variable:

**File:** `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

For production, update this to your deployed backend URL.

## Security Features

- Passwords hashed with bcrypt
- JWT tokens expire after 24 hours
- Tokens stored in localStorage (persists across sessions)
- Authorization header on all API requests
- Admin-only access enforcement

## API Endpoints Used

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/validate` - Validate token
- `GET /api/v1/tree/people` - Fetch all people
- `POST /api/v1/tree/people` - Create person
- `PUT /api/v1/tree/people/:id` - Update person
- `DELETE /api/v1/tree/people/:id` - Delete person

## Troubleshooting

### Login Fails
- Ensure backend is running (`docker ps` should show `findyourroot-db` and check `make dev`)
- Check credentials match those in backend `.env`
- Check browser console for API errors

### Token Expired
- Logout and login again
- Token lifetime is 24 hours

### CORS Issues
- Backend has CORS configured for `http://localhost:3000`
- For production, update CORS settings in `backend/cmd/server/main.go`

## Next Steps

1. **Deploy Backend** - Update API URL in frontend `.env.local`
2. **Configure CORS** - Add production domain to backend CORS config
3. **SSL/HTTPS** - Use HTTPS in production for secure token transmission
4. **Environment Variables** - Never commit `.env` files with credentials
