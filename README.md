# Events Management Platform

A modern, responsive web application for managing and attending events. Built with React 19, TypeScript, and integrated with a RESTful events API.

## Features

### For Event Attendees

- 🔍 Discover and search events with advanced filtering options
- 🎫 One-click registration with automatic ticket generation
- 📱 Mobile-responsive ticket access and management
- 📅 Personal event calendar integration

### For Event Organisers

- 📊 Comprehensive event management dashboard
- 👥 Team-based collaboration with role assignments
- 📝 Customisable event creation with detailed configuration options
- 🔔 Attendee communication tools

### For Administrators

- 🛡️ Robust user role management system
- 📈 Analytics dashboard with registration insights
- 🔐 Fine-grained permission controls
- 👤 Team and user administration tools

## Live Environments

- Production Site: https://event-platform-fe-one.vercel.app/
- API Endpoint: https://auth-api-test-1.onrender.com/api

## Tech Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 6
- **CSS Framework**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Routing**: React Router v7
- **Tanstack Query**: Tankstack React Query v5
- **Authentication**: JWT with refresh token strategy

## User Roles and Permissions

Our platform implements a comprehensive role-based access control system:

| Role          | Capabilities                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin         | Full system access including user management, team administration, and complete event control. Can promote other users to admin roles and access system-wide analytics. |
| Team Admin    | Can create and manage teams, invite and remove team members, assign team roles, and oversee all team events.                                                            |
| Event Manager | Creates and manages events for their team, controls event publication status, manages registrations and attendee lists, and handles ticket operations.                  |
| Team Member   | Has visibility into team events and member information. Can assist with event organisation based on permissions granted.                                                |
| Regular User  | Can browse events, register for events, manage personal tickets, and update their own profile information.                                                              |

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/TTibbs/event-platform-fe
   cd events-fe
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following content:

   ```
   VITE_API_URL=http://localhost:9090/api
   ```

   Adjust the API URL if your backend is running on a different port.

4. Start the development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Test Account Details

Test Credentials

| Role          | Username     | Password    |
| ------------- | ------------ | ----------- |
| Admin         | siteadmin    | password123 |
| Team Admin    | alice123     | password123 |
| Event Manager | eventmanager | password123 |
| Regular User  | regularuser  | password123 |

## Roadmap

We've implemented most of the core functionality, with some features still in development:

- ✅ Core event browsing and registration
- ✅ User authentication system
- ✅ Team management
- ✅ Event management dashboard
- ✅ Ticket generation and verification
- ✅ Role-based access control
- ✅ Admin dashboard for site wide administration
- ❌ Team member invitation system (coming in next sprint)
- ❌ Registration export functionality (coming in next sprint)

## API Integration

The application integrates with our Events API. Key endpoints include:

- /api/auth - Authentication endpoints
- /api/events - Event management
- /api/stripe - Stripe payment and session management
- /api/teams - Team management
- /api/tickets - Ticket management
- /api/users - User profiles

Full API documentation is available at the [API Documentation](https://auth-api-test-1.onrender.com/api).
