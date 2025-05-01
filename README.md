# Events Management Platform

A modern, responsive web application for managing and attending events. Built with React 19, TypeScript, and integrated with a RESTful events API.

## Features

- 🔐 User authentication and authorisation
- 📅 Browse and search upcoming events
- 🎫 Register for events and manage tickets
- 👥 Team management and collaboration
- 🛠️ Event creation and management dashboard

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

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Test Account Details

Test Credentials

| Role          | Username     | Password    |
| ------------- | ------------ | ----------- |
| Admin         | siteadmin    | password123 |
| Team Admin    | alice123     | password123 |
| Event Manager | eventmanager | password123 |
| User          | regularuser  | password123 |

## User Roles and Permissions

The application supports different user roles with varying permissions:

- **Site Admin**: Full access to all features
- **Team Admin**: Can create and manage events and team members
- **Event Manager**: Can create and manage events for their team
- **Team Member**: Can view team events and help with organisation
- **User**: Can browse events, register, and manage their tickets

## Acknowledgements

- [React](https://react.dev/) - The library for web and native user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TankstackQuery](https://tanstack.com/query/latest) - React query management
