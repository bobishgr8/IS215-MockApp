# Food Bank Singapore - Mock MVP

Mock MVP web application demonstrating end-to-end food rescue and redistribution operations for Food Bank Singapore.

## Features

### 4 User Roles
- **Donors**: Post food donation offers with expiry dates and pickup windows
- **Beneficiaries**: Post food needs, view ranked matches, claim offers
- **Volunteers**: Execute delivery routes with GPS check-ins and temperature monitoring
- **Operations**: Approve matches, create optimized routes, monitor KPIs

### Smart Matching Algorithm
- **FEFO Priority** (First Expired First Out)
- **Weighted Scoring**: Expiry (50%), Distance (30%), Urgency (15%), Surplus (5%)
- **Real-time Ranking**: Automatic recalculation on data changes
- **Explainability**: Visual tags and score breakdowns

### Route Optimization
- **Nearest Neighbor TSP**: Initial route construction
- **2-opt Improvement**: Route refinement (max 100 iterations)
- **Cold Chain Validation**: Ensures pickup before dropoff for chilled/frozen items
- **ETA Calculation**: 30 km/h average speed, 5-10 min stop durations

### Real-time KPIs
- Time-to-match (P50/P90)
- Match success rate & fill rate
- Total distance & CO₂ emissions
- Food rescued (kg)

## Quick Start [Frontend]

### Prerequisites
- Node.js 18+ and npm

### Installation
```
# Install dependencies
cd frontend
npm i

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and set:
# - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (for map features)
# - NEXT_PUBLIC_ADK_BACKEND_URL (default: http://localhost:8000)

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```bash
# Google Maps API Key (required for map features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here

# ADK Backend URL (Agent Development Kit server)
# Default: http://localhost:8000 (for local development)
# Production: Update to your deployed ADK server URL
NEXT_PUBLIC_ADK_BACKEND_URL=http://localhost:8000
```

**Note**: The `NEXT_PUBLIC_` prefix exposes the variable to the browser. Do not use this prefix for sensitive server-side secrets.
