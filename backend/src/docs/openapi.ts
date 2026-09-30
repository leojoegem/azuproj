const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
}

const success = (description: string) => ({
  description,
  content: { 'application/json': { schema: { type: 'object' } } },
})

const errors = {
  '400': { description: 'Validation failed.', content: { 'application/json': { schema: errorSchema } } },
  '401': { description: 'Authentication required.', content: { 'application/json': { schema: errorSchema } } },
  '403': { description: 'Forbidden.', content: { 'application/json': { schema: errorSchema } } },
  '404': { description: 'Not found.', content: { 'application/json': { schema: errorSchema } } },
  '409': { description: 'Conflict.', content: { 'application/json': { schema: errorSchema } } },
  '422': { description: 'Business rule rejected the request.', content: { 'application/json': { schema: errorSchema } } },
}

const bearer = [{ bearerAuth: [] }]
const json = (example: unknown) => ({
  required: true,
  content: { 'application/json': { schema: { type: 'object' }, example } },
})

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'RE:SET Asset Recovery API',
    version: '1.0.0',
    description:
      'REST API for laptop intake, assessment, sanitization, verification, disposition, reporting, and audit. Authenticate with a bearer access token. The React app should use API_BASE_URL, default http://localhost:5000/api.',
  },
  servers: [{ url: 'http://localhost:5000' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Devices' },
    { name: 'Assessments' },
    { name: 'Sanitization' },
    { name: 'Disposition' },
    { name: 'Dashboard' },
    { name: 'Reports' },
    { name: 'Audit' },
    { name: 'Documents' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: { Error: errorSchema },
  },
  paths: {
    '/api/health': {
      get: { tags: ['Auth'], summary: 'Health check', responses: { '200': success('API is running.') } },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Returns an access token, a rotating refresh token, and the user profile. Rate limited.',
        requestBody: json({ email: 'admin@reset.local', password: 'ChangeMe!234' }),
        responses: {
          '200': success('Login successful. data.user includes id, email, name, and role.'),
          '401': errors['401'],
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token',
        requestBody: json({ refreshToken: 'jwt' }),
        responses: { '200': success('New access and refresh tokens.'), '401': errors['401'] },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke a refresh token',
        requestBody: json({ refreshToken: 'jwt' }),
        responses: { '200': success('Logged out.') },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: bearer,
        responses: { '200': success('Current user.'), '401': errors['401'] },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password',
        security: bearer,
        requestBody: json({ currentPassword: 'ChangeMe!234', newPassword: 'NewPassword!234' }),
        responses: { '200': success('Password changed.'), '401': errors['401'], '422': errors['422'] },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a user (admin only)',
        description: 'Public registration is disabled. An ADMIN bearer token is required in every environment.',
        security: bearer,
        requestBody: json({
          email: 'assessor@reset.local',
          name: 'Amina Otieno',
          password: 'Assess!23456',
          role: 'ASSESSOR',
        }),
        responses: { '201': success('User created.'), '401': errors['401'], '403': errors['403'], '409': errors['409'] },
      },
    },
    '/api/users': {
      get: { tags: ['Users'], summary: 'List users', security: bearer, responses: { '200': success('Users.') } },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        security: bearer,
        requestBody: json({ email: 'viewer@reset.local', name: 'Viewer', password: 'Viewer!23456', role: 'VIEWER' }),
        responses: { '201': success('Created.'), '409': errors['409'] },
      },
    },
    '/api/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update name or role',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': success('Updated.'), '404': errors['404'] },
      },
    },
    '/api/users/{id}/disable': {
      post: {
        tags: ['Users'],
        summary: 'Disable a user and revoke sessions',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': success('Disabled.') },
      },
    },
    '/api/devices': {
      get: {
        tags: ['Devices'],
        summary: 'List devices',
        description:
          'Paginated. Filters: q, assetTag, serialNumber, manufacturer, model, department, location, status, condition, createdFrom, createdTo, sortBy, sortOrder, page, limit. Results are scoped by role. limit max is 100.',
        security: bearer,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', example: 'AWAITING_SANITIZATION' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': success('Page of devices in data.items.') },
      },
      post: {
        tags: ['Devices'],
        summary: 'Register a device',
        security: bearer,
        requestBody: json({
          assetTag: 'AST-001285',
          serialNumber: 'DL5420X9001',
          manufacturer: 'Dell',
          model: 'Latitude 5420',
          deviceType: 'LAPTOP',
          location: 'Nairobi HQ — Intake',
          department: 'Finance',
        }),
        responses: {
          '201': success('Device created with status RECEIVED.'),
          '400': errors['400'],
          '409': errors['409'],
        },
      },
    },
    '/api/devices/search': {
      get: {
        tags: ['Devices'],
        summary: 'Search devices',
        description: 'Same filters as GET /api/devices. Use q for asset tag, serial, manufacturer, or model.',
        security: bearer,
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { '200': success('Search results.') },
      },
    },
    '/api/devices/{id}': {
      get: { tags: ['Devices'], summary: 'Device detail with history', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Device.'), '404': errors['404'] } },
      patch: { tags: ['Devices'], summary: 'Update non-workflow device fields', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Updated.'), '422': errors['422'] } },
      delete: { tags: ['Devices'], summary: 'Soft-delete a device', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Archived. The row is retained.') } },
    },
    '/api/devices/{id}/approve-sanitization': {
      post: {
        tags: ['Sanitization'],
        summary: 'Approve sanitization',
        description: 'ADMIN only. Moves ASSESSMENT_COMPLETE devices that require sanitization to AWAITING_SANITIZATION.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': success('Approved.'), '422': errors['422'] },
      },
    },
    '/api/assessments': {
      get: { tags: ['Assessments'], summary: 'List assessments', security: bearer, responses: { '200': success('Assessments.') } },
      post: {
        tags: ['Assessments'],
        summary: 'Start an assessment',
        description:
          'Allowed from RECEIVED or ON_HOLD. Sets the device to UNDER_ASSESSMENT. Recommendations DONATE, RESELL, RECYCLE, SCRAP, and SANITIZE_AND_REDEPLOY always require sanitization. REDEPLOY, REPAIR, and REASSIGN require it unless sanitizationRequired is false. HOLD does not.',
        security: bearer,
        requestBody: json({
          deviceId: 'ckdeviceid',
          physicalCondition: 'GOOD',
          screenCondition: 'GOOD',
          keyboardCondition: 'FAIR',
          batteryCondition: 'GOOD',
          chargerCondition: 'GOOD',
          portsCondition: 'GOOD',
          storageHealth: 'GOOD',
          memoryHealth: 'GOOD',
          displayHealth: 'GOOD',
          operatingSystemCondition: 'GOOD',
          functionalTest: true,
          hardwareTest: true,
          batteryTest: true,
          networkTest: true,
          estimatedRepairCost: 6500,
          estimatedMarketValue: 42000,
          assessmentNotes: 'Palm rest wear. Battery health is acceptable for resale.',
          recommendation: 'RESELL',
        }),
        responses: { '201': success('Assessment started.'), '422': errors['422'] },
      },
    },
    '/api/assessments/{id}': {
      get: { tags: ['Assessments'], summary: 'Get assessment', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Assessment.') } },
      patch: { tags: ['Assessments'], summary: 'Update an in-progress assessment', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Updated.'), '422': errors['422'] } },
    },
    '/api/assessments/{id}/complete': {
      post: {
        tags: ['Assessments'],
        summary: 'Complete an assessment',
        description: 'Moves the device to ASSESSMENT_COMPLETE when sanitization is required, AWAITING_DISPOSITION when it is not, or ON_HOLD for HOLD.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': success('Completed.') },
      },
    },
    '/api/sanitization': {
      get: { tags: ['Sanitization'], summary: 'List sanitization records', security: bearer, responses: { '200': success('Records.') } },
      post: {
        tags: ['Sanitization'],
        summary: 'Start sanitization',
        description: 'Requires method, software, software version, and drive identity. The device must already be approved for sanitization.',
        security: bearer,
        requestBody: json({
          deviceId: 'ckdeviceid',
          method: 'NIST_800_88_PURGE',
          software: 'Vendor Secure Erase',
          softwareVersion: '4.2.1',
          driveType: 'NVMe SSD',
          driveIdentifier: '512 GB NVMe',
        }),
        responses: { '201': success('Started.'), '422': errors['422'] },
      },
    },
    '/api/sanitization/{id}': {
      get: { tags: ['Sanitization'], summary: 'Get sanitization record', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Record.') } },
    },
    '/api/sanitization/{id}/verify': {
      post: {
        tags: ['Sanitization'],
        summary: 'Verify sanitization',
        description: 'PASSED requires an evidence document uploaded against this record. FAILED keeps the device in SANITIZATION_IN_PROGRESS and requires notes. PASSED sets the device to SANITIZED.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: json({
          verificationMethod: 'Sample read-back',
          verificationResult: 'PASSED',
          documentId: 'ckdocumentid',
        }),
        responses: { '200': success('Verified.'), '422': errors['422'] },
      },
    },
    '/api/dispositions': {
      get: { tags: ['Disposition'], summary: 'List dispositions', security: bearer, responses: { '200': success('Dispositions.') } },
      post: {
        tags: ['Disposition'],
        summary: 'Open a disposition',
        description: 'Blocked until assessment is complete and required sanitization has passed. ADMIN submissions are approved immediately. Officers submit a draft.',
        security: bearer,
        requestBody: json({ deviceId: 'ckdeviceid', dispositionType: 'SOLD', recipientName: 'Secondary Market Ltd', salePrice: 42000, currency: 'KES' }),
        responses: { '201': success('Opened.'), '422': errors['422'] },
      },
    },
    '/api/dispositions/{id}/approve': {
      post: { tags: ['Disposition'], summary: 'Approve a draft disposition', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Approved.') } },
    },
    '/api/dispositions/{id}/reject': {
      post: { tags: ['Disposition'], summary: 'Reject a disposition and hold the device', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success('Rejected.') } },
    },
    '/api/dispositions/{id}/complete': {
      post: {
        tags: ['Disposition'],
        summary: 'Complete an approved disposition',
        description: 'Sets the device to REDEPLOYED, DISPOSED, RECYCLED, or SCRAPPED based on the disposition type. Destruction and scrap require a supporting document.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: json({ referenceNumber: 'DSP-2026-001284', salePrice: 42000 }),
        responses: { '200': success('Completed.'), '422': errors['422'] },
      },
    },
    '/api/dashboard/summary': { get: { tags: ['Dashboard'], summary: 'Counts calculated from devices', security: bearer, responses: { '200': success('Summary.') } } },
    '/api/dashboard/device-status': { get: { tags: ['Dashboard'], summary: 'Count by device status', security: bearer, responses: { '200': success('Status counts.') } } },
    '/api/dashboard/disposition-summary': { get: { tags: ['Dashboard'], summary: 'Completed dispositions by type', security: bearer, responses: { '200': success('Summary.') } } },
    '/api/dashboard/monthly-activity': { get: { tags: ['Dashboard'], summary: 'Last 12 months of activity', security: bearer, responses: { '200': success('Monthly series.') } } },
    '/api/reports/devices': { get: { tags: ['Reports'], summary: 'Device report. format=json|csv|pdf', security: bearer, responses: { '200': success('Report.'), '501': { description: 'PDF renderer is not registered.' } } } },
    '/api/reports/assessments': { get: { tags: ['Reports'], summary: 'Assessment report', security: bearer, responses: { '200': success('Report.') } } },
    '/api/reports/sanitization': { get: { tags: ['Reports'], summary: 'Sanitization report', security: bearer, responses: { '200': success('Report.') } } },
    '/api/reports/disposition': { get: { tags: ['Reports'], summary: 'Disposition report', security: bearer, responses: { '200': success('Report.') } } },
    '/api/reports/audit': { get: { tags: ['Reports'], summary: 'Audit report', security: bearer, responses: { '200': success('Report.') } } },
    '/api/audit': {
      get: {
        tags: ['Audit'],
        summary: 'Append-only audit log',
        description: 'Read-only. There is no update or delete endpoint.',
        security: bearer,
        responses: { '200': success('Audit events.') },
      },
    },
    '/api/documents': {
      get: { tags: ['Documents'], summary: 'List documents for an entity', security: bearer, parameters: [{ name: 'entityType', in: 'query', required: true, schema: { type: 'string' } }, { name: 'entityId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': success('Documents.') } },
      post: {
        tags: ['Documents'],
        summary: 'Upload evidence',
        description: 'Multipart field file plus entityType and entityId. JPEG, PNG, WEBP, or PDF. Stored names are generated; original filenames are not used as paths.',
        security: bearer,
        responses: { '201': success('Uploaded.'), '400': errors['400'] },
      },
    },
    '/api/documents/{id}/download': {
      get: { tags: ['Documents'], summary: 'Download a document', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'File bytes.' } } },
    },
  },
}
