# Verisentinel

Verisentinel is a comprehensive compliance and infrastructure monitoring platform designed for small to medium organizations, offering advanced network management capabilities with intelligent visualization and real-time insights.

![Verisentinel Dashboard](./generated-icon.png)

## Key Components

- Modern React frontend with dynamic and interactive network visualization
- Drizzle ORM and PostgreSQL Database for scalable data management
- Role-based access control for secure infrastructure monitoring
- Advanced device status tracking with hierarchical network mapping
- Enhanced security and compliance tracking mechanisms
- Comprehensive change management system with multi-stage approval workflows

## Features

- **Dashboard**: Get a comprehensive overview of your organization's infrastructure health and compliance status
- **Network Topology**: Visualize your network hierarchy with interactive diagrams
- **Hardware Inventory**: Track all your hardware assets and their respective statuses
- **Compliance Management**: Monitor compliance with various frameworks including PCI-DSS
- **Change Management**: Streamlined approval process with role-based workflows (RACI model)
- **Task Management**: Organize and track tasks with Kanban board visualization
- **User Management**: Administer user roles and permissions

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-organization/verisentinel.git
cd verisentinel
```

2. **Install dependencies**

```bash
npm install
```

3. **Database Setup**

Create a `.env` file in the root directory with the following content:

```
DATABASE_URL=postgresql://username:password@localhost:5432/verisentinel
```

Replace `username`, `password` with your PostgreSQL credentials.

4. **Set up the database**

First, run the setup script to create the initial tables:
```bash
tsx scripts/setup-db.ts
```

Then, update the schema with the latest fields:
```bash
tsx scripts/update-db-schema.ts
```

Finally, push any schema changes to the database:
```bash
npm run db:push
```

5. **Start the application**

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Default User Credentials

The system comes with pre-configured default users:

- **Administrator**
  - Username: `admin`
  - Password: `password123`
  - Role: `admin`

- **Security Officer**
  - Username: `ckaraca`
  - Password: `password123`
  - Role: `security`

- **Network Engineer**
  - Username: `engineer`
  - Password: `password123`
  - Role: `engineer`

## Project Structure

- `/client`: Frontend React application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Application pages
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions

- `/server`: Backend Express server
  - `/routes.ts`: API endpoints
  - `/storage.ts`: Data storage interfaces
  - `/auth.ts`: Authentication logic

- `/shared`: Code shared between client and server
  - `/schema.ts`: Database schema and type definitions

## Development Guidelines

### Database Management

When modifying the database setup:
1. Add the necessary Drizzle models and relations to `shared/schema.ts`
2. Update `server/storage.ts` to reflect your changes
3. Run `npm run db:push` to apply the changes to your database

### Adding New Features

1. Update the shared schema if needed
2. Implement backend routes in `server/routes.ts`
3. Create UI components in `client/src/components`
4. Add pages in `client/src/pages`
5. Update navigation in `client/src/components/layout/sidebar.tsx`

## Technical Stack

- **Frontend**: React, TanStack Query, TailwindCSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: Passport.js, express-session

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All technologies and libraries used in this project
- Contributors to this project

## Notification System

Verisentinel includes a comprehensive notification system for real-time alerts and updates. The system supports multiple notification types and delivery methods to ensure timely communication of important events.

### Notification Types

1. **System Notifications**
   - Audit events
   - System status changes
   - Security alerts
   - Compliance updates

2. **User Notifications**
   - Task assignments
   - Change request updates
   - Approval requests
   - Deadline reminders

3. **Device Notifications**
   - Status changes
   - Maintenance alerts
   - Security incidents
   - Performance warnings

### Delivery Methods

- In-app notifications (real-time via WebSocket)
- Email notifications (configurable)
- SMS alerts (for critical notifications)
- Webhook integrations (for external systems)

### Configuration

Notification preferences can be configured at both system and user levels:

```env
# .env configuration
NOTIFICATION_WEBSOCKET_PORT=8080
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_SMS_ENABLED=true
NOTIFICATION_WEBHOOK_URL=https://your-webhook-url.com
```

User preferences can be managed through the notification settings panel in the user profile.

### Usage Examples

```typescript
// Send a basic notification
await notify.info("New task assigned", {
  title: "Task Assignment",
  message: "You have been assigned a new task"
});

// Send an emergency notification
await notify.emergency("System outage detected", {
  title: "Critical System Alert",
  message: "Database connection lost",
  recipients: ["admin", "dba"]
});
```

### WebSocket Integration

The notification system uses WebSocket for real-time updates. To connect:

```typescript
// Frontend WebSocket connection
const ws = new WebSocket(`ws://localhost:8080/notifications`);

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Handle notification
};
```

### Notification Center

The notification center component provides a unified interface for managing notifications:

```typescript
import { NotificationCenter } from '@components/notifications';

function App() {
  return (
    <NotificationCenter
      onMarkAsRead={handleMarkAsRead}
      onClear={handleClear}
    />
  );
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Get user notifications |
| `/api/notifications/unread` | GET | Get unread notifications |
| `/api/notifications/:id/read` | PUT | Mark notification as read |
| `/api/notifications/preferences` | GET/PUT | Manage notification preferences |