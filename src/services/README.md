# Services Architecture

## Service Flow & Logic

### Architecture Pattern
- **Global Services**: Cross-module functionality in `src/services/`
- **Module Services**: Specific business logic in `src/app/management/*/services/`
- **Centralized Exports**: All services exported through `src/services/index.ts`

### Service Categories

**Global Services** (Used across modules):
- `authService` - Authentication
- `inventoryService` - Inventory management
- `payrollService` - Payroll processing
- `reportsService` - Analytics
- `salesService` - Point of sale
- `settingsService` - System configuration

**Module Services** (Management specific):
- `tenantService` - Tenant management
- `branchService` - Branch management
- `roleService` - Role management
- `userService` - User management

### Import Pattern
```typescript
// Always import from centralized location
import { authService, tenantService, inventoryService } from '../../services';
```

### Service Structure
```typescript
export const serviceName = {
  async getAll(): Promise<Entity[]> { /* ... */ },
  async getById(id: number): Promise<Entity> { /* ... */ },
  async create(data: CreateRequest): Promise<Entity> { /* ... */ },
  async update(id: number, data: UpdateRequest): Promise<Entity> { /* ... */ },
  async delete(id: number): Promise<void> { /* ... */ }
};
```

### Adding New Services
1. Create service file
2. Add export to `src/services/index.ts`
3. Import anywhere: `import { serviceName } from '../../services'`
