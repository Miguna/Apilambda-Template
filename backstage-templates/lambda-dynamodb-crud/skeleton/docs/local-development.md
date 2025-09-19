# Local Development

Guía completa para desarrollar y probar ${{ values.projectName }} localmente.

## Configuración del Entorno

### 1. Instalar Dependencias

```bash
npm install
```

### 2. DynamoDB Local

#### Opción A: Usar DynamoDB Local (Recomendado)

```bash
# Descargar DynamoDB Local
curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Ejecutar DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000

# En otra terminal, crear tabla
aws dynamodb create-table \
  --table-name ${{ values.tableName }} \
  --attribute-definitions \
    AttributeName=${{ values.pkAttribute }},AttributeType=S \
    AttributeName=${{ values.skAttribute }},AttributeType=S \
  --key-schema \
    AttributeName=${{ values.pkAttribute }},KeyType=HASH \
    AttributeName=${{ values.skAttribute }},KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --endpoint-url http://localhost:8000
```

#### Opción B: Usar AWS Real (Para desarrollo avanzado)

```bash
# Configurar AWS CLI
aws configure

# Usar tabla real en AWS
export TABLE_NAME=${{ values.tableName }}
export REGION=us-east-1
```

### 3. Variables de Entorno

Crear archivo `.env`:

```bash
# .env
TABLE_NAME=${{ values.tableName }}
REGION=us-east-1
ENDPOINT_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=fake
AWS_SECRET_ACCESS_KEY=fake
```

## Ejecutar el Servidor Local

```bash
# Ejecutar servidor Express
npm run local

# El servidor estará disponible en:
# http://localhost:3002
```

## Testing

### 1. Scripts de Testing Automatizados

#### Script cURL Interactivo

El proyecto incluye un script completo de testing con cURL:

```bash
# Hacer el script ejecutable
chmod +x api-test-scripts.sh

# Ver comandos disponibles
./api-test-scripts.sh help

# Demo completo CRUD
./api-test-scripts.sh demo

# Comandos individuales
./api-test-scripts.sh health
./api-test-scripts.sh create 123 "Mi ${{ values.entityName }}"
./api-test-scripts.sh get 123
./api-test-scripts.sh update 123 "Nuevo nombre"
./api-test-scripts.sh delete 123

# Test de stress
./api-test-scripts.sh stress 10

# Test de manejo de errores
./api-test-scripts.sh errors
```

### 2. Colección de Postman

Importa `postman-collection.json` en Postman para testing interactivo:

1. **Abrir Postman**
2. **Import** → **File** → Seleccionar `postman-collection.json`
3. **Configurar variables** en la colección:
   - `baseUrl`: `http://localhost:3002`
   - `entityId`: `001` (ID para testing)

La colección incluye:
- ✅ Tests automatizados para cada endpoint
- ✅ Variables dinámicas (IDs, timestamps)
- ✅ Validaciones de respuesta
- ✅ Manejo de errores

### 3. Testing Manual con cURL

{% for method in values.enabledMethods %}
{%- if method == 'POST' %}
#### Crear ${{ values.entityName }}
```bash
curl -X POST "http://localhost:3002${{ values.baseEndpoint }}" \
  -H "Content-Type: application/json" \
  -d '{
    "${{ values.pkAttribute }}": "${{ values.entityName | upper }}#001",
    "${{ values.skAttribute }}": "METADATA",
    "name": "Test ${{ values.entityName }}",
    "description": "Descripción de prueba"
  }'
```
{%- endif %}

{%- if method == 'GET' %}
#### Obtener ${{ values.entityName }}s
```bash
# Listar todos
curl -X GET "http://localhost:3002${{ values.baseEndpoint }}"

# Obtener específico
curl -X GET "http://localhost:3002${{ values.baseEndpoint }}/001"
```
{%- endif %}

{%- if method == 'PUT' %}
#### Actualizar ${{ values.entityName }}
```bash
curl -X PUT "http://localhost:3002${{ values.baseEndpoint }}/001" \
  -H "Content-Type: application/json" \
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

### 2. Testing con Postman

Importar la siguiente colección:

```json
{
  "info": {
    "name": "${{ values.projectName }} Local API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3002"
    }
  ],
  "item": [
{% for method in values.enabledMethods %}
{%- if method == 'GET' %}
    {
      "name": "Get All ${{ values.entityName }}s",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}${{ values.baseEndpoint }}"
      }
    },
    {
      "name": "Get ${{ values.entityName }} by ID",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}${{ values.baseEndpoint }}/001"
      }
    }{% if not loop.last %},{% endif %}
{%- endif %}
{%- if method == 'POST' %}
    {
      "name": "Create ${{ values.entityName }}",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}${{ values.baseEndpoint }}",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"${{ values.pkAttribute }}\": \"${{ values.entityName | upper }}#002\",\n  \"${{ values.skAttribute }}\": \"METADATA\",\n  \"name\": \"New ${{ values.entityName }}\"\n}"
        }
      }
    }{% if not loop.last %},{% endif %}
{%- endif %}
{% endfor %}
  ]
}
```

### 3. Testing Unitario (Próximamente)

```bash
# Instalar dependencias de testing
npm install --save-dev jest supertest

# Ejecutar tests
npm test
```

## Debugging

### 1. Logs Detallados

El servidor local incluye logging automático:

```javascript
// Los logs incluyen:
console.log(`${req.method} ${req.path}`);
console.log('Request Headers:', req.headers);
console.log('Request Body:', req.body);
```

### 2. Debug con VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug ${{ values.projectName }}",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server.mjs",
      "env": {
        "TABLE_NAME": "${{ values.tableName }}",
        "REGION": "us-east-1",
        "ENDPOINT_URL": "http://localhost:8000"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["--experimental-modules"]
    }
  ]
}
```

### 3. Inspeccionar Base de Datos Local

```bash
# Listar todas las tablas
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Escanear tabla
aws dynamodb scan \
  --table-name ${{ values.tableName }} \
  --endpoint-url http://localhost:8000

# Obtener item específico
aws dynamodb get-item \
  --table-name ${{ values.tableName }} \
  --key '{
    "${{ values.pkAttribute }}": {"S": "${{ values.entityName | upper }}#001"},
    "${{ values.skAttribute }}": {"S": "METADATA"}
  }' \
  --endpoint-url http://localhost:8000
```

## Estructura de Desarrollo

```
${{ values.projectName }}/
├── ${{ values.functionName }}/          # Función principal
│   ├── index.mjs                       # Handler Lambda
│   ├── local.mjs                       # Wrapper local
│   └── dynamo-policy.json              # Políticas IAM
├── events/                             # Utilidades
│   ├── baseEvent.mjs                   # Evento base
│   └── buildEvent.mjs                  # Constructor
├── server.mjs                          # Servidor Express
├── .env                                # Variables de entorno
├── .gitignore                          # Archivos ignorados
└── package.json                        # Dependencias
```

## Hot Reload

Para development con hot reload:

```bash
# Instalar nodemon
npm install -g nodemon

# Ejecutar con auto-restart
nodemon server.mjs
```

## Tips de Desarrollo

1. **Usar DynamoDB Local**: Más rápido y sin costos
2. **Logs abundantes**: Facilita el debugging
3. **Testing incremental**: Probar cada endpoint individualmente
4. **Variables de entorno**: Mantener configuración separada
5. **Git branches**: Usar branches para features nuevas

## Troubleshooting Local

### Puerto ocupado
```bash
# Encontrar proceso usando puerto 3002
lsof -ti:3002 | xargs kill -9
```

### DynamoDB Local no responde
```bash
# Verificar que DynamoDB esté corriendo
curl http://localhost:8000

# Reiniciar si es necesario
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

### Problemas de permisos AWS
```bash
# Usar credenciales fake para DynamoDB Local
export AWS_ACCESS_KEY_ID=fake
export AWS_SECRET_ACCESS_KEY=fake
```