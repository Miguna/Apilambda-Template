import { baseEvent } from './baseEvent.mjs';

export function buildEvent(req, overrides = {}) {
  console.log(`Building Lambda event for ${req.method} ${req.path}`);
  const now = new Date();

  const event = {
    ...structuredClone(baseEvent),
    routeKey: `${req.method} ${req.path}`,
    rawPath: req.path,
    rawQueryString: req.originalUrl.split('?')[1] || '',
    headers: {
      ...req.headers
    },
    queryStringParameters: req.query && Object.keys(req.query).length > 0 ? req.query : null,
    pathParameters: req.params && Object.keys(req.params).length > 0 ? req.params : null,
    body: req.body ? JSON.stringify(req.body) : '',
    requestContext: {
      ...baseEvent.requestContext,
      http: {
        ...baseEvent.requestContext.http,
        method: req.method,
        path: req.originalUrl,
        userAgent: req.get('User-Agent') || '${{ values.projectName }}-local',
      },
      time: now.toUTCString(),
      timeEpoch: now.getTime(),
      requestId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    ...overrides,
  };

  // Add operation metadata for CRUD operations
  if (overrides.operation) {
    event.operation = overrides.operation;
  }

  // Add entity metadata
  event.entityName = '${{ values.entityName }}';
  event.tableName = '${{ values.tableName }}';

  console.log('Event built successfully:', {
    method: event.requestContext.http.method,
    path: event.rawPath,
    operation: event.operation,
    hasBody: !!event.body,
    hasParams: !!event.pathParameters
  });

  return event;
}