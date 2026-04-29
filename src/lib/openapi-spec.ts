const spec = {
    openapi: '3.0.3',
    info: {
        title: 'N-Cargo API',
        version: '1.0.0',
        description: 'REST API for N-Cargo logistics management platform.',
    },
    servers: [{ url: '/api', description: 'Local dev server' }],
    tags: [
        { name: 'Auth', description: 'Authentication' },
        { name: 'Employees', description: 'Employee management' },
        { name: 'Contracts', description: 'Contract management' },
        { name: 'Jobs', description: 'Job positions' },
        { name: 'Tasks', description: 'Task assignment and tracking' },
        { name: 'Shipments', description: 'Shipment tracking' },
        { name: 'Quotations', description: 'Shipping quotations' },
        { name: 'Attendance', description: 'Employee attendance' },
        { name: 'Notifications', description: 'In-app notifications' },
        { name: 'Audit Logs', description: 'Audit trail' },
        { name: 'Pickup Points', description: 'Cargo pickup locations' },
        { name: 'System Config', description: 'Global system configuration' },
        { name: 'Employee KPIs', description: 'Daily productivity metrics' },
        { name: 'Attendance Actions', description: 'Clock-in / clock-out system' },
        { name: 'Analytics', description: 'On-the-fly performance and workload analytics' },
        { name: 'Shipping', description: 'Shipping provider and rate management (admin)' },
        { name: 'Locations', description: 'Geographic locations for origin/destination (admin)' },
        { name: 'Cotizaciones', description: 'Public shipping quotation calculator' },
    ],
    components: {
        schemas: {
            // ── Auth ──────────────────────────────────────────────
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'admin@ncargo.com' },
                    password: { type: 'string', example: 'secret123' },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'Juan Pérez' },
                    email: { type: 'string', format: 'email', example: 'juan@ncargo.com' },
                    password: { type: 'string', example: 'secret123' },
                },
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                    role: { type: 'string', example: 'ADMIN' },
                    email: { type: 'string', example: 'juan@ncargo.com' },
                },
            },
            // ── Tasks ─────────────────────────────────────────────
            TaskStatus: {
                type: 'string',
                enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NOT_DONE'],
            },
            CreateTaskRequest: {
                type: 'object',
                required: ['title', 'employeeId'],
                properties: {
                    title: { type: 'string', example: 'Revisar envíos del día' },
                    description: { type: 'string', example: 'Verificar todos los envíos pendientes' },
                    employeeId: { type: 'integer', example: 2 },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time', description: 'Deadline' },
                    metadata: { type: 'object', additionalProperties: true },
                },
            },
            UpdateTaskRequest: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { $ref: '#/components/schemas/TaskStatus' },
                    minutesSpent: { type: 'integer', example: 45 },
                    endTime: { type: 'string', format: 'date-time' },
                },
            },
            ReassignTaskRequest: {
                type: 'object',
                required: ['newEmployeeId'],
                properties: {
                    newEmployeeId: { type: 'integer', example: 3 },
                },
            },
            BulkAssignTaskRequest: {
                type: 'object',
                required: ['title', 'employeeIds'],
                properties: {
                    title: { type: 'string', example: 'Capacitación obligatoria' },
                    description: { type: 'string' },
                    employeeIds: { type: 'array', items: { type: 'integer' }, example: [2, 3, 4] },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' },
                    metadata: { type: 'object', additionalProperties: true },
                },
            },
            TaskResponse: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    status: { $ref: '#/components/schemas/TaskStatus' },
                    employeeId: { type: 'integer' },
                    createdBy: { type: 'integer' },
                    assignedBy: { type: 'integer', nullable: true },
                    startTime: { type: 'string', format: 'date-time', nullable: true },
                    endTime: { type: 'string', format: 'date-time', nullable: true },
                    minutesSpent: { type: 'integer', nullable: true },
                    metadata: { type: 'object', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            PaginatedTasks: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/TaskResponse' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                },
            },
            // ── Employees ─────────────────────────────────────────
            CreateEmployeeRequest: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'María López' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
                    metadata: { type: 'object', additionalProperties: true },
                },
            },
            UpdateEmployeeRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                    metadata: { type: 'object', additionalProperties: true },
                },
            },
            // ── Contracts ─────────────────────────────────────────
            CreateContractRequest: {
                type: 'object',
                required: ['jobId', 'contractTypeId', 'startDate'],
                properties: {
                    jobId: { type: 'integer' },
                    contractTypeId: { type: 'integer' },
                    salary: { type: 'number', format: 'float', example: 2500.00 },
                    hourlyRate: { type: 'number', format: 'float', example: 15.50 },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time', nullable: true },
                },
            },
            UpdateContractRequest: {
                type: 'object',
                properties: {
                    salary: { type: 'number', format: 'float' },
                    hourlyRate: { type: 'number', format: 'float' },
                    endDate: { type: 'string', format: 'date-time' },
                    isActive: { type: 'boolean' },
                },
            },
            // ── Jobs ──────────────────────────────────────────────
            CreateJobRequest: {
                type: 'object',
                required: ['title'],
                properties: {
                    title: { type: 'string', example: 'Operador de almacén' },
                    description: { type: 'string' },
                },
            },
            UpdateJobRequest: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                },
            },
            // ── Attendance Actions ─────────────────────────────────
            AttendanceResponse: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    employeeId: { type: 'integer' },
                    status: { type: 'string', enum: ['OPEN', 'PAUSED', 'CLOSED'] },
                    startedAt: { type: 'string', format: 'date-time' },
                    endedAt: { type: 'string', format: 'date-time', nullable: true },
                    workedHours: { type: 'number', nullable: true },
                },
            },
            AttendanceWithEvents: {
                allOf: [
                    { $ref: '#/components/schemas/AttendanceResponse' },
                    {
                        type: 'object',
                        properties: {
                            events: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'integer' },
                                        type: { type: 'string', enum: ['CLOCK_IN', 'PAUSE', 'RESUME', 'CLOCK_OUT'] },
                                        timestamp: { type: 'string', format: 'date-time' },
                                        locationMetadata: { type: 'object', nullable: true },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            // ── Analytics ─────────────────────────────────────────
            EmployeePerformance: {
                type: 'object',
                properties: {
                    employeeId: { type: 'integer' },
                    employeeName: { type: 'string' },
                    tasksCompleted: { type: 'integer' },
                    avgCompletionMinutes: { type: 'integer', nullable: true },
                    totalWorkedHours: { type: 'number' },
                    notDoneCount: { type: 'integer' },
                },
            },
            TaskCompletionItem: {
                type: 'object',
                properties: {
                    taskId: { type: 'integer' },
                    title: { type: 'string' },
                    employeeId: { type: 'integer' },
                    employeeName: { type: 'string' },
                    startTime: { type: 'string', format: 'date-time', nullable: true },
                    endTime: { type: 'string', format: 'date-time', nullable: true },
                    minutesSpent: { type: 'integer', nullable: true },
                },
            },
            WorkloadItem: {
                type: 'object',
                properties: {
                    employeeId: { type: 'integer' },
                    employeeName: { type: 'string' },
                    totalTasks: { type: 'integer' },
                    pendingCount: { type: 'integer' },
                    inProgressCount: { type: 'integer' },
                    completedCount: { type: 'integer' },
                    notDoneCount: { type: 'integer' },
                },
            },
            AlertItem: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['UNCLOSED_ATTENDANCE', 'OVERDUE_TASK', 'HIGH_NOT_DONE_RATE', 'NO_ACTIVITY'] },
                    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                    employeeId: { type: 'integer' },
                    employeeName: { type: 'string' },
                    detail: { type: 'string' },
                },
            },
            // ── Shipping ──────────────────────────────────────────
            LocationResponse: {
                type: 'object',
                properties: {
                    id:      { type: 'integer' },
                    country: { type: 'string', example: 'CO' },
                    region:  { type: 'string', nullable: true, example: 'ANTIOQUIA' },
                    city:    { type: 'string', example: 'MEDELLÍN' },
                },
            },
            ShippingRateResponse: {
                type: 'object',
                properties: {
                    id:            { type: 'integer' },
                    providerId:    { type: 'integer' },
                    originId:      { type: 'integer' },
                    destinationId: { type: 'integer' },
                    pricePerLb:    { type: 'number', example: 0 },
                    basePrice:     { type: 'number', example: 20 },
                    destination: {
                        type: 'object',
                        properties: {
                            id:      { type: 'integer' },
                            country: { type: 'string', example: 'CO' },
                            region:  { type: 'string', example: 'ANTIOQUIA', nullable: true },
                            city:    { type: 'string', example: 'MEDELLÍN' },
                        },
                    },
                },
            },
            CreateShippingRateRequest: {
                type: 'object',
                required: ['destinationId', 'basePrice'],
                properties: {
                    destinationId: { type: 'integer', description: 'Location.id of the destination city' },
                    originId:      { type: 'integer', description: 'Location.id of origin (defaults to Miami)' },
                    pricePerLb:    { type: 'number', default: 0 },
                    basePrice:     { type: 'number', example: 20, description: 'Flat delivery fee in USD' },
                },
            },
            UpdateShippingRateRequest: {
                type: 'object',
                properties: {
                    pricePerLb: { type: 'number' },
                    basePrice:  { type: 'number', example: 25 },
                },
            },
            // ── Cotizaciones ──────────────────────────────────────
            CityDropdownItem: {
                type: 'object',
                properties: {
                    id:         { type: 'integer' },
                    city:       { type: 'string', example: 'MEDELLÍN' },
                    department: { type: 'string', nullable: true, example: 'ANTIOQUIA' },
                    basePrice:  { type: 'number', example: 15, description: 'Flat delivery fee in USD (J6 in Excel formula)' },
                },
            },
            CiudadesResponse: {
                type: 'object',
                properties: {
                    country:         { type: 'string', example: 'CO' },
                    flatRateEnabled: { type: 'boolean' },
                    flatRatePrice:   { type: 'number', example: 5.0 },
                    data:            { type: 'array', items: { $ref: '#/components/schemas/CityDropdownItem' } },
                },
            },
            CalcularCotizacionRequest: {
                type: 'object',
                required: ['country', 'actualWeightLb', 'heightIn', 'lengthIn', 'widthIn', 'declaredValueUsd'],
                properties: {
                    country:               { type: 'string', enum: ['CO', 'MX'] },
                    destinationCityId: { type: 'integer', description: 'City.id — required when flat rate is OFF for country' },
                    actualWeightLb:        { type: 'number', example: 2 },
                    heightIn:              { type: 'number', example: 14 },
                    lengthIn:              { type: 'number', example: 7 },
                    widthIn:               { type: 'number', example: 10 },
                    declaredValueUsd:      { type: 'number', example: 117 },
                    pickupMiles:           { type: 'number', example: 0 },
                },
            },
            CotizacionBreakdown: {
                type: 'object',
                description: 'Excel I3 = SUM(J2:J7)',
                properties: {
                    transport:           { type: 'number', description: 'J2 — transport from Peso table' },
                    volumetricSurcharge: { type: 'number', description: 'J3 — max(0, volumetric−actual) as USD' },
                    insurance:           { type: 'number', description: 'J4 — ROUNDUP(declared × 10%, 0)' },
                    customs:             { type: 'number', description: 'J5 — ROUNDUP(declared × 31%, 0) if >$200' },
                    cityDelivery:        { type: 'number', description: 'J6 — flat city delivery fee' },
                    pickup:              { type: 'number', description: 'J7 — $10 + $2/extra mile beyond 8' },
                    total:               { type: 'number', description: 'I3 — sum of all components' },
                    detail: {
                        type: 'object',
                        properties: {
                            actualWeightLb:     { type: 'number' },
                            volumetricWeightLb: { type: 'number' },
                            chargeableWeightLb: { type: 'number' },
                            divisorUsed:        { type: 'number', example: 153 },
                            flatRateApplied:    { type: 'boolean' },
                            cityName:           { type: 'string', nullable: true },
                        },
                    },
                },
            },
            // ── Generic ───────────────────────────────────────────
            ErrorResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Error interno del servidor' },
                },
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
            },
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        parameters: {
            pageParam: { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            limitParam: { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            pageSizeParam: { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
            idParam: { name: 'id', in: 'query', required: true, schema: { type: 'integer' } },
        },
    },
    paths: {
        // ── AUTH ──────────────────────────────────────────────────
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
                responses: {
                    200: { description: 'JWT token', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
                    400: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new employee account',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
                responses: {
                    200: { description: 'JWT token', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
                    400: { description: 'Registration error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        // ── EMPLOYEES ─────────────────────────────────────────────
        '/employees': {
            get: {
                tags: ['Employees'],
                summary: 'List employees or get one by ID',
                description: 'If `id` is provided returns a single employee object. Otherwise returns a paginated list.',
                parameters: [
                    { name: 'id', in: 'query', description: 'Get a single employee by ID (omit for list)', schema: { type: 'integer', example: 1 } },
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/limitParam' },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
                    { name: 'roleId', in: 'query', schema: { type: 'integer' } },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Single employee (when id is provided) or paginated list' },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
            post: {
                tags: ['Employees'],
                summary: 'Create an employee',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEmployeeRequest' } } } },
                responses: { 201: { description: 'Created employee' }, 400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } },
            },
            put: {
                tags: ['Employees'],
                summary: 'Update an employee',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateEmployeeRequest' } } } },
                responses: { 200: { description: 'Updated employee' }, 400: { description: 'Error' } },
            },
            delete: {
                tags: ['Employees'],
                summary: 'Soft-delete (deactivate) an employee',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                responses: { 200: { description: 'Deactivated' }, 400: { description: 'Error' } },
            },
        },
        '/employees/contracts': {
            get: {
                tags: ['Contracts'],
                summary: 'Get contract by ID or list contracts by employee',
                description: 'If `contractId` is provided returns a single contract. If `employeeId` is provided returns all contracts for that employee.',
                parameters: [
                    { name: 'contractId', in: 'query', description: 'Get a single contract by its ID', schema: { type: 'integer', example: 1 } },
                    { name: 'employeeId', in: 'query', description: 'Get all contracts for this employee', schema: { type: 'integer', example: 2 } },
                ],
                responses: {
                    200: { description: 'Single contract or array of contracts' },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
            post: {
                tags: ['Contracts'],
                summary: 'Create a contract for an employee',
                parameters: [{ name: 'employeeId', in: 'query', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateContractRequest' } } } },
                responses: { 201: { description: 'Created contract' }, 400: { description: 'Error' } },
            },
            put: {
                tags: ['Contracts'],
                summary: 'Update a contract',
                parameters: [{ name: 'contractId', in: 'query', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateContractRequest' } } } },
                responses: { 200: { description: 'Updated contract' }, 400: { description: 'Error' } },
            },
        },
        '/contracts': {
            get: {
                tags: ['Contracts'],
                summary: 'List all contracts (with search)',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/limitParam' },
                    { name: 'search', in: 'query', description: 'Filter by employee name or job title', schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Contract list' } },
            },
            put: {
                tags: ['Contracts'],
                summary: 'Update a contract (general)',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateContractRequest' } } } },
                responses: { 200: { description: 'Updated contract' }, 400: { description: 'Error' } },
            },
        },
        // ── JOBS ──────────────────────────────────────────────────
        '/jobs': {
            get: {
                tags: ['Jobs'],
                summary: 'List all jobs or get one by ID',
                description: 'If `id` is provided returns a single job. Otherwise returns all jobs.',
                parameters: [{ name: 'id', in: 'query', description: 'Get a single job by ID (omit for full list)', schema: { type: 'integer', example: 1 } }],
                responses: {
                    200: { description: 'Single job (when id is provided) or full list' },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
            post: {
                tags: ['Jobs'],
                summary: 'Create a job position',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateJobRequest' } } } },
                responses: { 201: { description: 'Created job' }, 400: { description: 'Error' } },
            },
            put: {
                tags: ['Jobs'],
                summary: 'Update a job position',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateJobRequest' } } } },
                responses: { 200: { description: 'Updated job' }, 400: { description: 'Error' } },
            },
            delete: {
                tags: ['Jobs'],
                summary: 'Delete a job position',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                responses: { 200: { description: 'Deleted' }, 400: { description: 'Error' } },
            },
        },
        // ── TASKS ─────────────────────────────────────────────────
        '/tasks': {
            get: {
                tags: ['Tasks'],
                summary: 'Get task by ID, list by employee, or list all (paginated)',
                description: 'If `id` is provided returns a single task. If `employeeId` is provided returns all tasks assigned to that employee (paginated). Without either, returns all tasks (paginated).',
                parameters: [
                    { name: 'id', in: 'query', description: 'Get a single task by ID', schema: { type: 'integer', example: 1 } },
                    { name: 'employeeId', in: 'query', description: 'Get all tasks assigned to this employee', schema: { type: 'integer', example: 2 } },
                    { name: 'status', in: 'query', description: 'Filter by status (list mode only)', schema: { $ref: '#/components/schemas/TaskStatus' } },
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/limitParam' },
                ],
                responses: {
                    200: { description: 'Single task (when id is provided) or paginated task list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedTasks' } } } },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
            post: {
                tags: ['Tasks'],
                summary: 'Assign a task to one employee',
                description: 'Creates the task and sends a Resend email + in-app notification to the assigned employee.',
                parameters: [{ name: 'adminId', in: 'query', required: true, schema: { type: 'integer' }, description: 'ID of the admin assigning the task' }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTaskRequest' } } } },
                responses: {
                    201: { description: 'Created task', content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskResponse' } } } },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
            put: {
                tags: ['Tasks'],
                summary: 'Update a task',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTaskRequest' } } } },
                responses: {
                    200: { description: 'Updated task', content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskResponse' } } } },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
            delete: {
                tags: ['Tasks'],
                summary: 'Delete a task',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                responses: {
                    204: { description: 'Deleted — no content' },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        '/tasks/reassign': {
            put: {
                tags: ['Tasks'],
                summary: 'Reassign a task to another employee',
                description: 'Updates the assigned employee and sends email + in-app notification to the new employee.',
                parameters: [{ $ref: '#/components/parameters/idParam' }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReassignTaskRequest' } } } },
                responses: {
                    200: { description: 'Reassigned task', content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskResponse' } } } },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        '/tasks/bulk-assign': {
            post: {
                tags: ['Tasks'],
                summary: 'Assign the same task to multiple employees',
                description: 'Creates one task per employee ID and notifies each via email + in-app notification.',
                parameters: [{ name: 'adminId', in: 'query', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkAssignTaskRequest' } } } },
                responses: {
                    201: { description: 'Array of created tasks', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TaskResponse' } } } } },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        '/tasks/check-overdue': {
            post: {
                tags: ['Tasks'],
                summary: 'Mark overdue PENDING tasks as NOT_DONE',
                description: 'Scans all PENDING tasks whose deadline (endTime) has passed, marks them NOT_DONE, emails the assigning admin, and creates an in-app warning for the employee.',
                responses: {
                    200: { description: 'Processed successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Overdue tasks processed' } } } } } },
                    400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        // ── SHIPMENTS ─────────────────────────────────────────────
        '/shipments': {
            get: {
                tags: ['Shipments'],
                summary: 'List shipments',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                ],
                responses: { 200: { description: 'Paginated shipments with latest events' } },
            },
        },
        // ── QUOTATIONS ────────────────────────────────────────────
        '/quotations': {
            get: {
                tags: ['Quotations'],
                summary: 'List quotations',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                ],
                responses: { 200: { description: 'Paginated quotations' } },
            },
        },
        // ── ATTENDANCE ────────────────────────────────────────────
        '/attendance': {
            get: {
                tags: ['Attendance'],
                summary: 'List attendance records (admin)',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                ],
                responses: { 200: { description: 'Paginated attendance records with events' } },
            },
        },
        // ── ATTENDANCE ACTIONS ────────────────────────────────────
        '/attendance/clock-in': {
            post: {
                tags: ['Attendance Actions'],
                summary: 'Clock in',
                description: 'Starts a new attendance session. Records the client IP in the CLOCK_IN event. JWT required.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Attendance created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceWithEvents' } } } },
                    400: { description: 'Already clocked in today or error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        '/attendance/pause': {
            post: {
                tags: ['Attendance Actions'],
                summary: 'Pause attendance',
                description: 'Pauses an OPEN attendance session. IP must match the clock-in IP. JWT required.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Attendance paused', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceWithEvents' } } } },
                    400: { description: 'No active session or error' },
                    401: { description: 'Token missing or invalid' },
                    403: { description: 'IP mismatch' },
                },
            },
        },
        '/attendance/resume': {
            post: {
                tags: ['Attendance Actions'],
                summary: 'Resume attendance',
                description: 'Resumes a PAUSED attendance session. IP must match the clock-in IP. JWT required.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Attendance resumed', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceWithEvents' } } } },
                    400: { description: 'No paused session or error' },
                    401: { description: 'Token missing or invalid' },
                    403: { description: 'IP mismatch' },
                },
            },
        },
        '/attendance/clock-out': {
            post: {
                tags: ['Attendance Actions'],
                summary: 'Clock out',
                description: 'Closes the active attendance session and computes worked hours from event pairs. IP must match clock-in IP. JWT required.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Attendance closed with workedHours', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceWithEvents' } } } },
                    400: { description: 'No active session or error' },
                    401: { description: 'Token missing or invalid' },
                    403: { description: 'IP mismatch' },
                },
            },
        },
        '/attendance/today': {
            get: {
                tags: ['Attendance Actions'],
                summary: "Get employee's attendance for today",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'employeeId', in: 'query', required: true, schema: { type: 'integer', example: 1 } },
                ],
                responses: {
                    200: { description: "Today's attendance with events", content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceWithEvents' } } } },
                    401: { description: 'Token missing or invalid' },
                    404: { description: 'No attendance today' },
                },
            },
        },
        '/attendance/history': {
            get: {
                tags: ['Attendance Actions'],
                summary: "Get employee's attendance history (paginated)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'employeeId', in: 'query', required: true, schema: { type: 'integer', example: 1 } },
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/limitParam' },
                ],
                responses: {
                    200: { description: 'Paginated attendance history' },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        // ── AUTH LOGOUT ───────────────────────────────────────────
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout — closes the active session',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Logged out successfully' },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        // ── ANALYTICS ─────────────────────────────────────────────
        '/analytics/employee-performance': {
            get: {
                tags: ['Analytics'],
                summary: 'Employee performance summary',
                description: 'Computed on-the-fly: tasks completed, avg completion time, total worked hours, not-done count.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'employeeId', in: 'query', description: 'Filter to a single employee (omit for all active employees)', schema: { type: 'integer' } },
                    { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
                    { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
                ],
                responses: {
                    200: { description: 'Array of performance objects', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/EmployeePerformance' } } } } },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        '/analytics/task-completion': {
            get: {
                tags: ['Analytics'],
                summary: 'Task completion times',
                description: 'Returns all COMPLETED tasks with computed minutesSpent.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'employeeId', in: 'query', schema: { type: 'integer' } },
                    { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
                    { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
                ],
                responses: {
                    200: { description: 'Array of task completion items', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TaskCompletionItem' } } } } },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        '/analytics/workload': {
            get: {
                tags: ['Analytics'],
                summary: 'Workload distribution per employee',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
                    { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
                ],
                responses: {
                    200: { description: 'Array of workload items', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/WorkloadItem' } } } } },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        '/analytics/alerts': {
            get: {
                tags: ['Analytics'],
                summary: 'Active anomaly alerts',
                description: 'Detects unclosed attendances, overdue tasks, high not-done rates, and employees with no recent activity.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Array of alert objects', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AlertItem' } } } } },
                    401: { description: 'Token missing or invalid' },
                },
            },
        },
        // ── NOTIFICATIONS ─────────────────────────────────────────
        '/notifications': {
            get: {
                tags: ['Notifications'],
                summary: 'List in-app notifications',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                    { name: 'unread', in: 'query', description: 'Filter unread only', schema: { type: 'boolean' } },
                ],
                responses: { 200: { description: 'Paginated notifications' } },
            },
        },
        // ── AUDIT LOGS ────────────────────────────────────────────
        '/audit-logs': {
            get: {
                tags: ['Audit Logs'],
                summary: 'List audit logs',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                    { name: 'entity', in: 'query', description: 'Filter by entity type (e.g. Task, Employee)', schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Paginated audit log entries' } },
            },
        },
        // ── PICKUP POINTS ─────────────────────────────────────────
        '/pickup-points': {
            get: {
                tags: ['Pickup Points'],
                summary: 'List pickup points',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                    { name: 'active', in: 'query', description: 'Filter active/inactive', schema: { type: 'boolean' } },
                ],
                responses: { 200: { description: 'Paginated pickup points' } },
            },
        },
        // ── LOCATIONS ─────────────────────────────────────────────
        '/locations': {
            get: {
                tags: ['Locations'],
                summary: 'List locations by country (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'country', in: 'query', required: true, schema: { type: 'string', example: 'CO' } }],
                responses: {
                    200: { description: 'Array of locations', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/LocationResponse' } }, total: { type: 'integer' } } } } } },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        // ── SHIPPING PROVIDERS ────────────────────────────────────
        '/shipping-providers': {
            get: {
                tags: ['Shipping'],
                summary: 'List all shipping providers (admin)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Array of providers' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/shipping-providers/{id}/rates': {
            get: {
                tags: ['Shipping'],
                summary: 'List all rates for a provider (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Array of ShippingRateResponse', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ShippingRateResponse' } }, total: { type: 'integer' } } } } } },
                    401: { description: 'Unauthorized' },
                },
            },
            post: {
                tags: ['Shipping'],
                summary: 'Add a new city rate for a provider (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateShippingRateRequest' } } } },
                responses: {
                    201: { description: 'Created rate', content: { 'application/json': { schema: { $ref: '#/components/schemas/ShippingRateResponse' } } } },
                    400: { description: 'Validation error' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/shipping-providers/{id}/rates/{rateId}': {
            patch: {
                tags: ['Shipping'],
                summary: 'Update a city rate price (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id',     in: 'path', required: true, schema: { type: 'integer' } },
                    { name: 'rateId', in: 'path', required: true, schema: { type: 'integer' } },
                ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateShippingRateRequest' } } } },
                responses: {
                    200: { description: 'Updated rate' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Rate not found' },
                },
            },
            delete: {
                tags: ['Shipping'],
                summary: 'Delete a city rate (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id',     in: 'path', required: true, schema: { type: 'integer' } },
                    { name: 'rateId', in: 'path', required: true, schema: { type: 'integer' } },
                ],
                responses: {
                    204: { description: 'Deleted' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Rate not found' },
                },
            },
        },
        // ── COTIZACIONES (PUBLIC) ─────────────────────────────────
        '/cotizaciones/ciudades': {
            get: {
                tags: ['Cotizaciones'],
                summary: 'List cities for the calculator dropdown (public)',
                parameters: [{ name: 'country', in: 'query', required: true, schema: { type: 'string', enum: ['CO', 'MX'] } }],
                responses: {
                    200: { description: 'CiudadesResponse with flat-rate flag and city list', content: { 'application/json': { schema: { $ref: '#/components/schemas/CiudadesResponse' } } } },
                    400: { description: 'Invalid country' },
                },
            },
        },
        '/cotizaciones/calcular': {
            post: {
                tags: ['Cotizaciones'],
                summary: 'Calculate shipping price using Excel formula (public)',
                description: 'Replicates I3 = SUM(J2:J7): transport + volumetric surcharge + insurance + customs + city delivery + pickup',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CalcularCotizacionRequest' } } } },
                responses: {
                    200: { description: 'Breakdown + total', content: { 'application/json': { schema: { $ref: '#/components/schemas/CotizacionBreakdown' } } } },
                    400: { description: 'Validation error or weight out of range' },
                },
            },
        },
        // ── SYSTEM CONFIG ─────────────────────────────────────────
        '/system-config': {
            get: {
                tags: ['System Config'],
                summary: 'Get all system configuration values',
                description: 'Returns all key-value config entries (e.g. IVA rate, base price per lb, min weight).',
                responses: { 200: { description: 'All config entries' } },
            },
        },
        '/system-config/{key}': {
            patch: {
                tags: ['System Config'],
                summary: 'Update a single system config value (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string', example: 'divisor' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['value'], properties: { value: { description: 'Any JSON-serializable value' } } } } } },
                responses: {
                    200: { description: 'Updated config record' },
                    400: { description: 'Missing value field' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        // ── EMPLOYEE KPIs ─────────────────────────────────────────
        '/employee-kpis': {
            get: {
                tags: ['Employee KPIs'],
                summary: 'List employee daily KPIs',
                parameters: [
                    { $ref: '#/components/parameters/pageParam' },
                    { $ref: '#/components/parameters/pageSizeParam' },
                    { name: 'employeeId', in: 'query', schema: { type: 'integer' } },
                ],
                responses: { 200: { description: 'Paginated KPI records' } },
            },
        },
    },
}

export default spec
