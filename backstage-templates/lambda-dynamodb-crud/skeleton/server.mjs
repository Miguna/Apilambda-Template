import express from 'express';
import { buildEvent } from './events/buildEvent.mjs';
import { handler as ${{ values.functionName | camelCase }} } from './${{ values.functionName }}/local.mjs';
import cors from 'cors';

const app = express();

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:4200', 'http://localhost:3000', 'http://localhost:3002'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie', 'Access-Control-Allow-Credentials']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Request Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', req.body);
  }
  next();
});

// Handle preflight OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(204);
  } else {
    next();
  }
});

// ===========================================
// LAMBDA RESPONSE HANDLER UTILITY
// ===========================================

function handleLambdaResponse(result, res) {
  console.log('Lambda response:', JSON.stringify(result, null, 2));

  // Set status code
  const statusCode = result.statusCode || 200;
  res.status(statusCode);

  // Handle regular headers
  if (result.headers) {
    Object.entries(result.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
  }

  // Handle multi-value headers
  if (result.multiValueHeaders) {
    Object.entries(result.multiValueHeaders).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach(value => {
          res.append(key, value);
        });
      } else {
        res.set(key, values);
      }
    });
  }

  // Send the body
  if (result.body) {
    if (typeof result.body === 'string') {
      try {
        const parsedBody = JSON.parse(result.body);
        res.json(parsedBody);
      } catch (e) {
        res.send(result.body);
      }
    } else {
      res.json(result.body);
    }
  } else {
    res.end();
  }
}

// ===========================================
// ${{ values.entityName | upper }} CRUD ENDPOINTS
// ===========================================

{% for method in values.enabledMethods %}
{%- if method == 'GET' %}
// GET - Obtener todos los ${{ values.entityName | lower }}s
app.get('${{ values.baseEndpoint }}', async (req, res) => {
  console.log('¡Llegó una petición GET a ${{ values.baseEndpoint }}');
  const event = buildEvent(req, { operation: 'list' });
  const result = await ${{ values.functionName | camelCase }}(event);
  handleLambdaResponse(result, res);
});

// GET - Obtener ${{ values.entityName | lower }} específico por ID
app.get('${{ values.baseEndpoint }}/:id', async (req, res) => {
  console.log(`¡Llegó una petición GET a ${{ values.baseEndpoint }}/:id`);
  const event = buildEvent(req, { operation: 'get' });
  const result = await ${{ values.functionName | camelCase }}(event);
  handleLambdaResponse(result, res);
});
{%- endif %}

{%- if method == 'POST' %}
// POST - Crear nuevo ${{ values.entityName | lower }}
app.post('${{ values.baseEndpoint }}', async (req, res) => {
  console.log('¡Llegó una petición POST a ${{ values.baseEndpoint }}');
  const event = buildEvent(req, { operation: 'create' });
  const result = await ${{ values.functionName | camelCase }}(event);
  handleLambdaResponse(result, res);
});
{%- endif %}

{%- if method == 'PUT' %}
// PUT - Actualizar ${{ values.entityName | lower }} existente
app.put('${{ values.baseEndpoint }}/:id', async (req, res) => {
  console.log(`¡Llegó una petición PUT a ${{ values.baseEndpoint }}/:id`);
  const event = buildEvent(req, { operation: 'update' });
  const result = await ${{ values.functionName | camelCase }}(event);
  handleLambdaResponse(result, res);
});
{%- endif %}

{%- if method == 'DELETE' %}
// DELETE - Eliminar ${{ values.entityName | lower }}
app.delete('${{ values.baseEndpoint }}/:id', async (req, res) => {
  console.log(`¡Llegó una petición DELETE a ${{ values.baseEndpoint }}/:id`);
  const event = buildEvent(req, { operation: 'delete' });
  const result = await ${{ values.functionName | camelCase }}(event);
  handleLambdaResponse(result, res);
});
{%- endif %}
{% endfor %}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '${{ values.projectName }}',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
{% for method in values.enabledMethods %}
      '${{ method }} ${{ values.baseEndpoint }}'{% if not loop.last %},{% endif %}
{% endfor %}
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: [
{% for method in values.enabledMethods %}
      '${{ method }} ${{ values.baseEndpoint }}'{% if not loop.last %},{% endif %}
{% endfor %}
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log('✅ ${{ values.projectName }} server running');
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}${{ values.baseEndpoint }}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Entity: ${{ values.entityName }}`);
  console.log(`🗄️  Table: ${{ values.tableName }}`);
});