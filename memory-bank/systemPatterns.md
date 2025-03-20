# System Patterns

## Architecture Overview

The application follows a client-server architecture with clear separation of concerns:

### Client-Side Architecture
- Single Page Application (SPA) built with React and Vite
- Component-based structure with shadcn/ui
- Client-side routing with Wouter
- State management with React Query and local state
- Form handling with React Hook Form and Zod validation

### Server-Side Architecture
- Express.js server with TypeScript
- RESTful API endpoints
- Session-based authentication with Passport.js
- PostgreSQL database with Drizzle ORM
- WebSocket support for real-time features

## Design Patterns

### Frontend Patterns

1. **Component Composition**
   - Atomic design principles
   - Reusable UI components from shadcn/ui
   - Composition over inheritance

2. **State Management**
   - React Query for server state
   - Local state with React hooks
   - Form state with React Hook Form
   - Polling-based real-time updates

3. **Routing Pattern**
   - Client-side routing with Wouter
   - Route-based code splitting
   - Protected routes with authentication

4. **Data Fetching**
   - React Query for data fetching and caching
   - Optimistic updates
   - Error boundary handling

5. **Real-time Data Patterns**
   - Polling with React Query
   - Configurable polling intervals
   - Background polling for inactive tabs
   - Optimistic updates for better UX
   - Stale-time configuration for network optimization

### Backend Patterns

1. **RESTful API Design**
   - Resource-based routing
   - Standard HTTP methods
   - Consistent error handling
   - Input validation with Zod

2. **Authentication Flow**
   - Session-based authentication
   - Passport.js strategies
   - Secure session handling
   - Role-based access control

3. **Database Access**
   - Repository pattern with Drizzle ORM
   - Type-safe queries
   - Migration management
   - Connection pooling

4. **Real-time Communication**
   - WebSocket integration
   - Event-based messaging
   - Connection management

## Component Patterns

1. **Layout Components**
   - Consistent page structure
   - Responsive design
   - Theme management

2. **Form Components**
   - Controlled inputs
   - Validation with Zod
   - Error handling
   - Loading states

3. **Data Display Components**
   - Tables with sorting and filtering
   - Charts and visualizations
   - Loading skeletons
   - Error states

4. **Interactive Components**
   - Modals and dialogs
   - Tooltips and popovers
   - Drag and drop interfaces
   - Infinite scrolling

## Audit Logging

### Severity Levels
The system uses standardized severity levels for audit logs:
- 0: Emergency - System is unusable
- 1: Alert - Action must be taken immediately
- 2: Critical - Critical conditions
- 3: Error - Error conditions
- 4: Warning - Warning conditions
- 5: Notice - Normal but significant condition
- 6: Info - Informational messages (default)
- 7: Debug - Debug-level messages

### Audit Log Structure
Each audit log entry must include:
1. `severity`: Number (0-7) indicating importance
2. `user`: Username of the actor (or "system")
3. `action`: String describing the action (e.g., "create_device")
4. `resource`: String identifying affected resource (e.g., "device/123")
5. `message`: Descriptive message about the action
6. `complianceStandards`: Array of relevant compliance standards

### Usage Patterns
```typescript
// Direct audit logging
await storage.createAuditLog({
  severity: 6, // Info level
  message: "Created device: Main Server",
  action: "create_device",
  resource: "device/123",
  user: req.user?.username || "system",
  complianceStandards: []
});

// Status change logging
await storage.createAuditLog({
  severity: 6,
  message: `Updated device: ${device.name}, status changed from ${oldStatus} to ${newStatus}`,
  action: "update_device",
  resource: `device/${device.id}`,
  user: req.user?.username || "system",
  complianceStandards: []
});

// Deletion logging
await storage.createAuditLog({
  severity: 6,
  message: `Deleted device: ${device.name}`,
  action: "delete_device",
  resource: `device/${device.id}`,
  user: req.user?.username || "system",
  complianceStandards: []
});
```

### Best Practices
1. Use descriptive action names (e.g., "create_device", "update_device")
2. Format resource identifiers as "type/id"
3. Include relevant context in messages
4. Set appropriate severity levels
5. Add compliance standards when applicable
6. Validate input before logging
7. Handle errors gracefully

## Error Handling

1. **Client-Side Errors**
   - React error boundaries
   - Form validation errors
   - API error handling
   - Fallback UI components

2. **Server-Side Errors**
   - Global error middleware
   - Validation errors
   - Database errors
   - Authentication errors

### HTTP Status Codes
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### Error Response Format
```typescript
{
  message: string;
  errors?: ValidationError[];
}
```

### Validation
1. Use Zod schemas for input validation
2. Validate before database operations
3. Return detailed validation errors
4. Log validation failures appropriately

## Security Patterns

1. **Authentication**
   - Session management
   - Password hashing
   - CSRF protection
   - Secure cookies

2. **Authorization**
   - Role-based access control
   - Resource-level permissions
   - API route protection

3. **Data Security**
   - Input sanitization
   - SQL injection prevention
   - XSS protection
   - CORS configuration

## Performance Patterns

1. **Client-Side Performance**
   - Code splitting
   - Lazy loading
   - Asset optimization
   - Caching strategies
   - Optimized polling intervals

2. **Server-Side Performance**
   - Connection pooling
   - Query optimization
   - Response caching
   - Rate limiting

3. **Real-time Data Management**
   - Configurable polling intervals
   - Background polling optimization
   - Network usage optimization with stale-time
   - Fallback mechanisms for network issues
   - Balance between data freshness and server load

## Testing Patterns

1. **Unit Testing**
   - Component testing
   - Hook testing
   - Utility function testing
   - Mocking strategies

2. **Integration Testing**
   - API endpoint testing
   - Authentication flow testing
   - Database interaction testing

3. **End-to-End Testing**
   - User flow testing
   - Cross-browser testing
   - Performance testing

## Development Workflow

1. **Code Organization**
   - Feature-based structure
   - Shared utilities
   - Type definitions
   - Constants and configurations

2. **Build Process**
   - Development server with Vite
   - Production builds
   - Environment configuration
   - Asset management

3. **Deployment**
   - Build optimization
   - Environment variables
   - Database migrations
   - Monitoring and logging

## Maintenance Patterns

1. **Code Quality**
   - TypeScript strict mode
   - ESLint configuration
   - Prettier formatting
   - Code review guidelines

2. **Documentation**
   - Code comments
   - API documentation
   - Component documentation
   - Setup instructions

3. **Monitoring**
   - Error tracking
   - Performance monitoring
   - User analytics
   - Server health checks

## Authentication & Authorization

### Middleware
1. `withAuth`: Ensures user is authenticated
2. `withPermission`: Checks specific permissions
3. `attachAuditLogger`: Adds audit logging capability

### User Context
- Available via `req.user`
- Includes username and permissions
- Used for audit logging and authorization

## Database Operations

### CRUD Patterns
1. Validate input using Zod schemas
2. Perform database operation
3. Log action to audit log
4. Return response to client

### Transaction Handling
1. Begin transaction
2. Perform operations
3. Log to audit log
4. Commit or rollback transaction

## API Response Patterns

### Success Responses
1. Return appropriate status code
2. Include requested data
3. Use consistent response format

### Error Responses
1. Use appropriate status code
2. Include descriptive message
3. Add validation errors if applicable
4. Log error appropriately

## Notification System

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

### Notification Levels
```typescript
type NotificationLevel = "emergency" | "alert" | "critical" | "error" | "warning" | "notice" | "info" | "debug";

interface NotificationOptions {
  level: NotificationLevel;
  title: string;
  message: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
  expiration?: Date;
  recipients?: string[];
}
```

### Usage Patterns
```typescript
// Basic notification
await notify.info("New task assigned", {
  title: "Task Assignment",
  message: "You have been assigned a new task"
});

// Emergency notification with recipients
await notify.emergency("System outage detected", {
  title: "Critical System Alert",
  message: "Database connection lost",
  recipients: ["admin", "dba"],
  resource: "database/main"
});

// Warning with action
await notify.warning("Device offline", {
  title: "Device Status Alert",
  message: "Router-01 is not responding",
  action: "check_device",
  resource: "device/router-01"
});

// Notice with metadata
await notify.notice("Maintenance scheduled", {
  title: "Planned Maintenance",
  message: "System update scheduled",
  metadata: {
    startTime: "2024-03-20T10:00:00Z",
    duration: "2h",
    services: ["auth", "api"]
  }
});
```

### Implementation Details
1. **Notification Service**
   ```typescript
   class NotificationService {
     async send(options: NotificationOptions): Promise<void>;
     async broadcast(options: NotificationOptions): Promise<void>;
     async getUnread(userId: string): Promise<Notification[]>;
     async markAsRead(notificationId: string): Promise<void>;
     async delete(notificationId: string): Promise<void>;
   }
   ```

2. **Delivery Methods**
   - In-app notifications
   - WebSocket real-time updates
   - Email notifications (optional)
   - SMS alerts (critical only)
   - Webhook integrations

3. **Storage**
   - Temporary storage for active notifications
   - Persistent storage for notification history
   - User preferences for notification settings

### Best Practices
1. **Message Format**
   - Clear and concise titles
   - Descriptive messages
   - Actionable information
   - Relevant metadata

2. **Priority Handling**
   - Emergency notifications bypass user preferences
   - Rate limiting for non-critical notifications
   - Batching of similar notifications
   - Expiration for time-sensitive alerts

3. **User Experience**
   - Real-time delivery when possible
   - Notification grouping
   - Mark as read/unread
   - Notification history
   - Customizable preferences

4. **Error Handling**
   - Retry logic for failed deliveries
   - Fallback delivery methods
   - Error logging and monitoring
   - Queue management

### Integration Points
1. **Frontend**
   ```typescript
   // React hook for notifications
   const { notifications, markAsRead, clear } = useNotifications();
   
   // Notification component
   <NotificationCenter
     notifications={notifications}
     onMarkAsRead={markAsRead}
     onClear={clear}
   />
   ```

2. **Backend**
   ```typescript
   // Express middleware
   app.use(attachNotificationService);
   
   // Route handler
   app.post("/api/tasks", async (req, res) => {
     const task = await createTask(req.body);
     await req.notify.info("Task created", {
       title: "New Task",
       message: `Task "${task.title}" has been created`,
       recipients: [task.assignedTo]
     });
   });
   ```

3. **WebSocket**
   ```typescript
   // WebSocket notification handler
   ws.on("notification", (data) => {
     notificationService.send({
       ...data,
       delivery: "websocket"
     });
   });
   ```

### Notification Flow
1. **Creation**
   - Generate notification content
   - Determine recipients
   - Set priority and expiration
   - Add metadata

2. **Processing**
   - Apply user preferences
   - Check delivery rules
   - Handle rate limiting
   - Prepare for delivery

3. **Delivery**
   - Send through appropriate channels
   - Handle delivery confirmation
   - Retry on failure
   - Update notification status

4. **Management**
   - Store in notification history
   - Handle read/unread status
   - Apply expiration rules
   - Clean up old notifications
