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

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

# Install dependencies
npm i

# Run development server

npm run dev
```
