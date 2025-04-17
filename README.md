# Events Management Platform

A modern, responsive web application for managing and attending events. Built with React 19, TypeScript, and integrated with a RESTful events API.

## Features

- 🔐 User authentication and authorization
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

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

### Installation

1. Clone the repository

   ```bash
   git clone [your-repo-url]
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

## API Integration

This frontend application is built to work with the Events Management API. The API documentation can be found in the `responseFormat.md` file.

<details>
<summary>Available API Endpoints</summary>

| Category       | Endpoints                                                   |
| -------------- | ----------------------------------------------------------- |
| Authentication | Login, Register, Refresh Token, Logout                      |
| Users          | Get All Users, Get User, Get User by Username               |
| Events         | Get All Events, Get Event by ID, Create Event, Update Event |
| Teams          | Get All Teams, Get Team by ID, Get Team Members             |
| Tickets        | Get All Tickets, Get Ticket by ID, Verify Ticket            |

</details>

## Project Structure

```
events-fe/
├── src/
│   ├── api/           # API integration and axios client
│   ├── assets/        # Static assets and resources
│   ├── components/    # Reusable UI components
│   │   └── ui/        # shadcn/ui components
│   ├── contexts/      # Context providers (Auth, Theme)
│   ├── lib/           # Utility functions and shared code
│   ├── pages/         # Page components for routing
│   └── types/         # TypeScript type definitions
├── public/            # Public static files
└── index.html         # HTML entry point
```

## Test Account Details

<details>
<summary>Test Credentials</summary>

| Role          | Username | Password                |
| ------------- | -------- | ----------------------- |
| Admin         | admin    | [YOUR-ADMIN-PASSWORD]   |
| User          | user     | [YOUR-USER-PASSWORD]    |
| Event Manager | manager  | [YOUR-MANAGER-PASSWORD] |

**Note**: Replace the placeholder passwords with your actual test account passwords before sharing.

</details>

## User Roles and Permissions

The application supports different user roles with varying permissions:

- **Admin**: Full access to all features
- **Event Manager**: Can create and manage events for their team
- **Team Member**: Can view team events and help with organization
- **User**: Can browse events, register, and manage their tickets

## Roadmap

- Mobile application
- Payment gateway integration
- Advanced event analytics
- Social media sharing

## License

[Your License] - See the LICENSE file for details.

## Acknowledgements

- [React](https://react.dev/) - The library for web and native user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
