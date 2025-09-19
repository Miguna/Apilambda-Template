# API Reference

La API de ${{ values.projectName }} proporciona operaciones CRUD completas para la entidad **${{ values.entityName }}**.

## Endpoints Base

**URL Base**: `${{ values.baseEndpoint }}`
**Puerto Local**: `3002`

{% for method in values.enabledMethods %}
{%- if method == 'GET' %}
## GET - Obtener {{ values.entityName }}s

### Listar todos los {{ values.entityName | lower }}s

```http
GET ${{ values.baseEndpoint }}
```

**Query Parameters:**
- `{{ values.pkAttribute }}` (opcional): Filtrar por partition key
- `{{ values.skAttribute }}` (opcional): Filtrar por sort key

**Ejemplo de respuesta:**
```json
{
  "statusCode": 200,
  "body": {
    "items": [
      {
        "{{ values.pkAttribute }}": "{{ values.entityName | upper }}#123",
        "{{ values.skAttribute }}": "METADATA",
        "name": "Ejemplo {{ values.entityName }}",
        "createdAt": "2023-10-15T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

### Obtener {{ values.entityName | lower }} específico

```http
GET ${{ values.baseEndpoint }}/{id}
```

**Path Parameters:**
- `id`: Identificador del {{ values.entityName | lower }}

**Ejemplo de respuesta:**
```json
{
  "statusCode": 200,
  "body": {
    "{{ values.pkAttribute }}": "{{ values.entityName | upper }}#123",
    "{{ values.skAttribute }}": "METADATA",
    "name": "Ejemplo {{ values.entityName }}",
    "createdAt": "2023-10-15T10:30:00Z"
  }
}
```
{%- endif %}

{%- if method == 'POST' %}
## POST - Crear {{ values.entityName }}

```http
POST ${{ values.baseEndpoint }}
Content-Type: application/json
```

**Request Body:**
```json
{
  "{{ values.pkAttribute }}": "{{ values.entityName | upper }}#124",
  "{{ values.skAttribute }}": "METADATA",
  "name": "Nuevo {{ values.entityName }}",
  "description": "Descripción del {{ values.entityName | lower }}"
}
```

**Ejemplo de respuesta:**
```json
{
  "statusCode": 201,
  "body": {
    "{{ values.pkAttribute }}": "{{ values.entityName | upper }}#124",
    "{{ values.skAttribute }}": "METADATA",
    "name": "Nuevo {{ values.entityName }}",
    "description": "Descripción del {{ values.entityName | lower }}",
    "createdAt": "2023-10-15T10:30:00Z"
  }
}
```

**Códigos de Error:**
- `400`: Datos inválidos o faltantes
- `409`: {{ values.entityName }} ya existe
{%- endif %}

{%- if method == 'PUT' %}
## PUT - Actualizar {{ values.entityName }}

```http
PUT ${{ values.baseEndpoint }}/{id}
Content-Type: application/json
```

**Path Parameters:**
- `id`: Identificador del {{ values.entityName | lower }}

**Request Body:**
```json
{
  "name": "{{ values.entityName }} Actualizado",
  "description": "Nueva descripción"
}
```

**Ejemplo de respuesta:**
```json
{
  "statusCode": 200,
  "body": {
    "{{ values.pkAttribute }}": "{{ values.entityName | upper }}#123",
    "{{ values.skAttribute }}": "METADATA",
    "name": "{{ values.entityName }} Actualizado",
    "description": "Nueva descripción",
    "updatedAt": "2023-10-15T10:35:00Z"
  }
}
```

**Códigos de Error:**
- `404`: {{ values.entityName }} no encontrado
- `400`: Datos inválidos
{%- endif %}

{%- if method == 'DELETE' %}
## DELETE - Eliminar {{ values.entityName }}

```http
DELETE ${{ values.baseEndpoint }}/{id}
```

**Path Parameters:**
- `id`: Identificador del {{ values.entityName | lower }}

**Ejemplo de respuesta:**
```json
{
  "statusCode": 204,
  "body": {
    "message": "{{ values.entityName }} eliminado exitosamente"
  }
}
```

**Códigos de Error:**
- `404`: {{ values.entityName }} no encontrado
{%- endif %}
{% endfor %}

## Estructura de Errores

Todos los errores siguen el formato estándar:

```json
{
  "statusCode": 400,
  "body": {
    "error": "BadRequest",
    "message": "Descripción detallada del error",
    "requestId": "uuid-del-request",
    "timestamp": "2023-10-15T10:30:00Z"
  }
}
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `204` | Recurso eliminado exitosamente |
| `400` | Solicitud inválida |
| `404` | Recurso no encontrado |
| `409` | Conflicto (recurso ya existe) |
| `500` | Error interno del servidor |

## Ejemplos con cURL

{% for method in values.enabledMethods %}
{%- if method == 'GET' %}
### Obtener todos los {{ values.entityName | lower }}s
```bash
curl -X GET "http://localhost:3002${{ values.baseEndpoint }}"
```
{%- endif %}

{%- if method == 'POST' %}
### Crear nuevo {{ values.entityName | lower }}
```bash
curl -X POST "http://localhost:3002${{ values.baseEndpoint }}" \
  -H "Content-Type: application/json" \
  -d '{
    "{{ values.pkAttribute }}": "{{ values.entityName | upper }}#125",
    "{{ values.skAttribute }}": "METADATA",
    "name": "{{ values.entityName }} desde cURL"
  }'
```
{%- endif %}

{%- if method == 'PUT' %}
### Actualizar {{ values.entityName | lower }}
```bash
curl -X PUT "http://localhost:3002${{ values.baseEndpoint }}/123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{{ values.entityName }} Actualizado"
  }'
```
{%- endif %}

{%- if method == 'DELETE' %}
### Eliminar {{ values.entityName | lower }}
```bash
curl -X DELETE "http://localhost:3002${{ values.baseEndpoint }}/123"
```
{%- endif %}
{% endfor %}