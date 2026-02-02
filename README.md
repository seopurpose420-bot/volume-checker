# Keyword Dashboard

A secure web application for managing and analyzing keyword search volumes with authentication and database storage.

## Features

- 🔐 Secure login (admin/admin123)
- 📊 Interactive dashboard with statistics
- 🗄️ SQLite database storage
- 📈 Data visualization and filtering
- 📋 Export functionality
- 🚀 Vercel deployment ready

## APIs

### POST /api/keywords
Store keyword data in database
```json
{
  "data": [
    {
      "keyword": "example",
      "search_volume": 1000,
      "selected_date": "2024-01-15",
      "checked_time": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /api/keywords
Retrieve all keyword data (requires authentication)

### DELETE /api/keywords
Clear all data (requires authentication)

## Deployment

1. Push to GitHub repository
2. Connect to Vercel
3. Deploy automatically

## Local Development

```bash
npm install
npm start
```

Visit http://localhost:3000

## Login Credentials
- Username: admin
- Password: admin123