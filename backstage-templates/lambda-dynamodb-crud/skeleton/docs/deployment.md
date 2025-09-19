# Deployment Guide

Esta guía te ayudará a desplegar tu servicio ${{ values.projectName }} en AWS.

## Requisitos Previos

- AWS CLI configurado
- Permisos IAM para Lambda y DynamoDB
- Node.js 18.x o superior

## Configuración de AWS

### 1. Crear Tabla DynamoDB

```bash
aws dynamodb create-table \
  --table-name ${{ values.tableName }} \
  --attribute-definitions \
    AttributeName=${{ values.pkAttribute }},AttributeType=S \
    AttributeName=${{ values.skAttribute }},AttributeType=S \
  --key-schema \
    AttributeName=${{ values.pkAttribute }},KeyType=HASH \
    AttributeName=${{ values.skAttribute }},KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 2. Crear Rol IAM para Lambda

```bash
# Crear rol
aws iam create-role \
  --role-name ${{ values.functionName }}Role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Adjuntar política básica de Lambda
aws iam attach-role-policy \
  --role-name ${{ values.functionName }}Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Crear y adjuntar política personalizada de DynamoDB
aws iam create-policy \
  --policy-name ${{ values.functionName }}DynamoPolicy \
  --policy-document file://${{ values.functionName }}/dynamo-policy.json

aws iam attach-role-policy \
  --role-name ${{ values.functionName }}Role \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/${{ values.functionName }}DynamoPolicy
```

**lambda-trust-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 3. Desplegar Función Lambda

```bash
# Comprimir código
zip -r ${{ values.functionName }}.zip ${{ values.functionName }}/ events/ package.json

# Crear función Lambda
aws lambda create-function \
  --function-name ${{ values.functionName }} \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT-ID:role/${{ values.functionName }}Role \
  --handler ${{ values.functionName }}/index.handler \
  --zip-file fileb://${{ values.functionName }}.zip \
  --environment Variables='{
    "TABLE_NAME": "${{ values.tableName }}",
    "REGION": "us-east-1"
  }' \
  --timeout 30 \
  --memory-size 256
```

### 4. Configurar API Gateway

```bash
# Crear API REST
aws apigateway create-rest-api \
  --name ${{ values.projectName }}-api \
  --description "API para ${{ values.description }}"

# Obtener ID de la API (reemplazar API-ID)
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`${{ values.projectName }}-api`].id' --output text)

# Obtener root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text)

# Crear resource para {{ values.baseEndpoint }}
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part {{ values.baseEndpoint | replace('/', '') }}
```

## Variables de Entorno

Configure las siguientes variables en Lambda:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `TABLE_NAME` | `${{ values.tableName }}` | Nombre de la tabla DynamoDB |
| `REGION` | `us-east-1` | Región de AWS |

## Monitoreo y Logs

### CloudWatch Logs

Los logs de Lambda están disponibles en CloudWatch:

```bash
# Ver logs recientes
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/${{ values.functionName }}

# Seguir logs en tiempo real
aws logs tail /aws/lambda/${{ values.functionName }} --follow
```

### Métricas

Métricas importantes a monitorear:

- **Duration**: Tiempo de ejecución
- **Errors**: Número de errores
- **Throttles**: Limitaciones de concurrencia
- **Invocations**: Número de invocaciones

## Estrategias de Deployment

### 1. Blue/Green Deployment

```bash
# Crear alias para producción
aws lambda create-alias \
  --function-name ${{ values.functionName }} \
  --name PROD \
  --function-version 1

# Actualizar código
aws lambda update-function-code \
  --function-name ${{ values.functionName }} \
  --zip-file fileb://${{ values.functionName }}-v2.zip

# Publicar nueva versión
aws lambda publish-version \
  --function-name ${{ values.functionName }}

# Actualizar alias gradualmente
aws lambda update-alias \
  --function-name ${{ values.functionName }} \
  --name PROD \
  --function-version 2 \
  --routing-config AdditionalVersionWeights='{"1"=0.1}'
```

### 2. Canary Deployment

Use AWS CodeDeploy para deployments canary automáticos.

## Rollback

En caso de problemas:

```bash
# Rollback a versión anterior
aws lambda update-alias \
  --function-name ${{ values.functionName }} \
  --name PROD \
  --function-version 1
```

## Testing en Producción

```bash
# Test básico
curl -X GET "https://API-ID.execute-api.us-east-1.amazonaws.com/prod${{ values.baseEndpoint }}"

# Test con datos
curl -X POST "https://API-ID.execute-api.us-east-1.amazonaws.com/prod${{ values.baseEndpoint }}" \
  -H "Content-Type: application/json" \
  -d '{
    "${{ values.pkAttribute }}": "TEST#001",
    "${{ values.skAttribute }}": "METADATA",
    "name": "Test {{ values.entityName }}"
  }'
```

## Costos Estimados

Para una carga moderada (1000 requests/día):

- **Lambda**: ~$0.20/mes
- **DynamoDB**: ~$1.25/mes
- **API Gateway**: ~$3.50/mes
- **Total**: ~$5/mes

## Troubleshooting

### Errores Comunes

1. **Permission Denied**: Verificar políticas IAM
2. **Table Not Found**: Confirmar nombre de tabla y región
3. **Timeout**: Incrementar timeout de Lambda
4. **Memory Limit**: Aumentar memoria asignada

### Logs de Debug

Habilitar logs detallados:

```javascript
// En index.mjs
console.log('Event received:', JSON.stringify(event, null, 2));
console.log('Environment:', process.env);
```