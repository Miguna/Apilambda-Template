# ${{ values.projectName | title }}

${{ values.description }}

## Descripción

Este servicio implementa operaciones CRUD completas para la entidad **${{ values.entityName }}** utilizando AWS Lambda y DynamoDB.

### Características

- ✅ **Función Lambda**: `${{ values.functionName }}`
- ✅ **Tabla DynamoDB**: `${{ values.tableName }}`
- ✅ **Operaciones soportadas**:
{% for method in values.enabledMethods -%}
  - {{ method }}
{% endfor %}
- ✅ **Testing local**: Servidor Express integrado
- ✅ **Eventos canónicos**: Compatibles con API Gateway

### Arquitectura

```mermaid
graph TD
    A[API Gateway] --> B[Lambda Function]
    B --> C[DynamoDB Table]
    B --> D[Express Server Local]

    subgraph "DynamoDB Schema"
        E[{{ values.pkAttribute }}]
        F[{{ values.skAttribute }}]
    end

    C --> E
    C --> F
```

### Estructura del Proyecto

```
${{ values.projectName }}/
├── ${{ values.functionName }}/          # Función Lambda principal
│   ├── index.mjs                       # Handler principal
│   ├── local.mjs                       # Wrapper para testing local
│   └── dynamo-policy.json              # Políticas IAM
├── events/                             # Utilidades de eventos
│   ├── baseEvent.mjs                   # Evento base Lambda
│   └── buildEvent.mjs                  # Constructor de eventos
├── server.mjs                          # Servidor Express local
├── package.json                        # Dependencias
└── docs/                               # Documentación
```

## Inicio Rápido

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar DynamoDB local** (opcional):
   ```bash
   # Ejecutar DynamoDB Local
   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

   # Crear tabla
   aws dynamodb create-table \
     --table-name ${{ values.tableName }} \
     --attribute-definitions AttributeName=${{ values.pkAttribute }},AttributeType=S AttributeName=${{ values.skAttribute }},AttributeType=S \
     --key-schema AttributeName=${{ values.pkAttribute }},KeyType=HASH AttributeName=${{ values.skAttribute }},KeyType=RANGE \
     --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
     --endpoint-url http://localhost:8000
   ```

3. **Ejecutar servidor local**:
   ```bash
   npm run local
   ```

4. **Probar endpoints**:
   - Base URL: `http://localhost:3002`
   - Endpoints disponibles: `${{ values.baseEndpoint }}`

## Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `TABLE_NAME` | Nombre de la tabla DynamoDB | `${{ values.tableName }}` |
| `REGION` | Región de AWS | `us-east-1` |
| `ENDPOINT_URL` | URL de DynamoDB (local) | `http://localhost:8000` |

## Próximos Pasos

- Revisa la [documentación de la API](api.md)
- Aprende sobre [deployment](deployment.md)
- Configura tu [entorno local](local-development.md)