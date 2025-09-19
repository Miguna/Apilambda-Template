# ${{ values.projectName | title }}

${{ values.description }}

## 🚀 Descripción

Este proyecto implementa un servicio serverless completo para operaciones CRUD en la entidad **${{ values.entityName }}** utilizando:

- **AWS Lambda**: Función serverless `${{ values.functionName }}`
- **Amazon DynamoDB**: Base de datos NoSQL `${{ values.tableName }}`
- **Express.js**: Servidor local para desarrollo y testing
- **Backstage**: Integración completa con catalog y TechDocs

## 📋 Características

- ✅ **Operaciones CRUD completas**:
{% for method in values.enabledMethods -%}
  - **{{ method }}**: {% if method == 'GET' %}Obtener {% elif method == 'POST' %}Crear {% elif method == 'PUT' %}Actualizar {% elif method == 'DELETE' %}Eliminar {% endif %}${{ values.entityName | lower }}{% if method == 'GET' %}(s){% endif %}
{% endfor %}
- ✅ **Esquema DynamoDB**: PK/SK con `${{ values.pkAttribute }}` y `${{ values.skAttribute }}`
- ✅ **Testing local**: Servidor Express integrado
- ✅ **Eventos canónicos**: Compatible con API Gateway
- ✅ **Manejo de errores**: Respuestas estandarizadas
- ✅ **Políticas IAM**: Permisos mínimos necesarios
- ✅ **Documentación**: TechDocs integrada

## 🛠️ Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Crear archivo .env
cat > .env << EOF
TABLE_NAME=${{ values.tableName }}
REGION=us-east-1
ENDPOINT_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=fake
AWS_SECRET_ACCESS_KEY=fake
EOF
```

### 3. Configurar DynamoDB Local

```bash
# Descargar DynamoDB Local (solo primera vez)
curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Ejecutar DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

# En otra terminal, crear tabla
aws dynamodb create-table \\
  --table-name ${{ values.tableName }} \\
  --attribute-definitions \\
    AttributeName=${{ values.pkAttribute }},AttributeType=S \\
    AttributeName=${{ values.skAttribute }},AttributeType=S \\
  --key-schema \\
    AttributeName=${{ values.pkAttribute }},KeyType=HASH \\
    AttributeName=${{ values.skAttribute }},KeyType=RANGE \\
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \\
  --endpoint-url http://localhost:8000
```

### 4. Ejecutar Servidor Local

```bash
npm run local
```

El servidor estará disponible en: **http://localhost:3002**

## 📡 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
{% for method in values.enabledMethods %}
| `{{ method }}` | `${{ values.baseEndpoint }}{% if method in ['GET', 'PUT', 'DELETE'] and method != 'GET' %}/:id{% endif %}{% if method == 'GET' %}`<br>`${{ values.baseEndpoint }}/:id{% endif %}` | {% if method == 'GET' %}Listar/Obtener {% elif method == 'POST' %}Crear {% elif method == 'PUT' %}Actualizar {% elif method == 'DELETE' %}Eliminar {% endif %}${{ values.entityName | lower }}{% if method == 'GET' %}(s){% endif %} |
{% endfor %}

## 🧪 Testing de la API

### Scripts Automatizados

```bash
# Hacer ejecutable y ver ayuda
chmod +x api-test-scripts.sh
./api-test-scripts.sh help

# Demo completo CRUD
./api-test-scripts.sh demo

# Tests individuales
./api-test-scripts.sh create 123 "Mi ${{ values.entityName }}"
./api-test-scripts.sh get 123
./api-test-scripts.sh update 123 "Nuevo nombre"
```

### Colección Postman

Importa `postman-collection.json` en Postman para testing interactivo con validaciones automáticas.

### Ejemplos de Uso

{% for method in values.enabledMethods %}
{%- if method == 'POST' %}
#### Crear ${{ values.entityName }}

```bash
curl -X POST "http://localhost:3002${{ values.baseEndpoint }}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "${{ values.pkAttribute }}": "${{ values.entityName | upper }}#001",
    "${{ values.skAttribute }}": "METADATA",
    "name": "Ejemplo ${{ values.entityName }}",
    "description": "Descripción de ejemplo"
  }'
```
{%- endif %}

{%- if method == 'GET' %}
#### Obtener ${{ values.entityName }}s

```bash
# Listar todos
curl "http://localhost:3002${{ values.baseEndpoint }}"

# Obtener específico
curl "http://localhost:3002${{ values.baseEndpoint }}/001"
```
{%- endif %}

{%- if method == 'PUT' %}
#### Actualizar ${{ values.entityName }}

```bash
curl -X PUT "http://localhost:3002${{ values.baseEndpoint }}/001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "${{ values.entityName }} Actualizado",
    "description": "Nueva descripción"
  }'
```
{%- endif %}

{%- if method == 'DELETE' %}
#### Eliminar ${{ values.entityName }}

```bash
curl -X DELETE "http://localhost:3002${{ values.baseEndpoint }}/001"
```
{%- endif %}
{% endfor %}

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│   AWS Lambda    │───▶│   DynamoDB      │
│                 │    │ ${{ values.functionName }} │    │ ${{ values.tableName }} │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │ Express Server  │
                       │ (Local Testing) │
                       └─────────────────┘
```

## 📁 Estructura del Proyecto

```
${{ values.projectName }}/
├── ${{ values.functionName }}/          # Función Lambda principal
│   ├── index.mjs                       # Handler Lambda CRUD
│   ├── local.mjs                       # Wrapper para testing local
│   └── dynamo-policy.json              # Políticas IAM específicas
├── events/                             # Utilidades de eventos
│   ├── baseEvent.mjs                   # Evento base Lambda
│   └── buildEvent.mjs                  # Constructor de eventos
├── docs/                               # Documentación TechDocs
│   ├── index.md                        # Documentación principal
│   ├── api.md                          # Referencia de API
│   ├── deployment.md                   # Guía de deployment
│   └── local-development.md            # Desarrollo local
├── server.mjs                          # Servidor Express para testing
├── package.json                        # Dependencias y scripts
├── mkdocs.yml                          # Configuración TechDocs
├── catalog-info.yaml                   # Configuración Backstage
└── README.md                           # Este archivo
```

## 🔧 Scripts Disponibles

```bash
# Ejecutar servidor local
npm run local

# Ejecutar servidor (alias)
npm start

# Ejecutar tests (próximamente)
npm test

# Linting (próximamente)
npm run lint
```

## 🌐 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `TABLE_NAME` | Nombre de la tabla DynamoDB | `${{ values.tableName }}` |
| `REGION` | Región de AWS | `us-east-1` |
| `ENDPOINT_URL` | URL de DynamoDB (local) | `http://localhost:8000` |
| `PORT` | Puerto del servidor Express | `3002` |

## 🚦 Health Check

El servidor incluye un endpoint de health check:

```bash
curl http://localhost:3002/health
```

Respuesta:
```json
{
  "status": "healthy",
  "service": "${{ values.projectName }}",
  "version": "1.0.0",
  "timestamp": "2023-10-15T10:30:00Z",
  "endpoints": [
{% for method in values.enabledMethods %}
    "${{ method }} ${{ values.baseEndpoint }}"{% if not loop.last %},{% endif %}
{% endfor %}
  ]
}
```

## 📊 Schema DynamoDB

### Estructura de Items

```json
{
  "${{ values.pkAttribute }}": "${{ values.entityName | upper }}#<ID>",
  "${{ values.skAttribute }}": "METADATA",
  "id": "<ID>",
  "name": "Nombre del ${{ values.entityName | lower }}",
  "description": "Descripción opcional",
  "createdAt": "2023-10-15T10:30:00Z",
  "updatedAt": "2023-10-15T10:30:00Z",
  "entityType": "${{ values.entityName }}",
  "version": 1
}
```

### Patrones de Acceso

1. **Obtener ${{ values.entityName | lower }} por ID**: `${{ values.pkAttribute }} = "${{ values.entityName | upper }}#<ID>" AND ${{ values.skAttribute }} = "METADATA"`
2. **Listar todos los ${{ values.entityName | lower }}s**: `Scan` con filtro por entityType
3. **Buscar por PK específico**: `Query` con `${{ values.pkAttribute }}`

## 🚀 Deployment

Para desplegar en AWS, consulta la [guía de deployment](docs/deployment.md).

### Deployment Rápido

```bash
# Comprimir función
zip -r ${{ values.functionName }}.zip ${{ values.functionName }}/ events/ package.json

# Crear función Lambda
aws lambda create-function \\
  --function-name ${{ values.functionName }} \\
  --runtime nodejs18.x \\
  --role arn:aws:iam::ACCOUNT-ID:role/${{ values.functionName }}Role \\
  --handler ${{ values.functionName }}/index.handler \\
  --zip-file fileb://${{ values.functionName }}.zip
```

## 🔗 Enlaces Útiles

- [📚 Documentación Completa](docs/)
- [🔌 Referencia de API](docs/api.md)
- [🏠 Desarrollo Local](docs/local-development.md)
- [🚀 Guía de Deployment](docs/deployment.md)
- [📋 Backstage Service](http://localhost:3000/catalog/default/component/${{ values.projectName }})

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/${{ values.destination.owner }}/${{ values.destination.repo }}/issues)
- **Documentación**: [TechDocs](docs/)
- **Wiki**: [GitHub Wiki](https://github.com/${{ values.destination.owner }}/${{ values.destination.repo }}/wiki)

---

**Generado con ❤️ por Backstage Template**