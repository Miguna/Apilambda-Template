# 🚀 Guía de Inicio Rápido

Esta guía te llevará desde cero hasta tener tu primer servicio Lambda generado y funcionando localmente.

---

## 📋 Prerrequisitos

### **Herramientas Necesarias**

- ✅ **Node.js** 18.x o superior
- ✅ **AWS CLI** configurado
- ✅ **Java** 8+ (para DynamoDB Local)
- ✅ **Git** para clonación de repos
- ✅ **Backstage** funcionando

### **Conocimientos Recomendados**

- 🔧 Básicos de AWS Lambda
- 🗄️ Conceptos de DynamoDB
- 🎭 Familiaridad con Backstage
- 📦 npm/Node.js basics

---

## 🎯 Paso 1: Configurar Template en Backstage

### **Opción A: Configuración en app-config.yaml (Recomendado)**

Añade esto a tu `app-config.yaml` de Backstage:

```yaml
scaffolder:
  templates:
    - type: url
      target: https://github.com/Miguna/Apilambda-Template/blob/main/backstage-templates/lambda-dynamodb-crud/template.yaml

catalog:
  locations:
    - type: url
      target: https://github.com/Miguna/Apilambda-Template/blob/main/catalog-info.yaml
```

### **Opción B: Importación Manual**

1. Ve a **Backstage → Register Component**
2. Usa esta URL: `https://github.com/Miguna/Apilambda-Template/blob/main/catalog-info.yaml`
3. Para el template, configura en scaffolder directamente

---

## 🏗️ Paso 2: Crear Tu Primer Servicio

### **1. Abrir Backstage**

- Ve a **"Create Component"**
- Busca **"Lambda DynamoDB CRUD Service"**

### **2. Completar Formulario**

```yaml
# Información del Proyecto
projectName: customer-service
description: Servicio de gestión de customers
functionName: CustomerManagement

# Configuración DynamoDB
tableName: Customers_STD
entityName: Customer
pkAttribute: PK
skAttribute: SK

# Configuración de Endpoints
baseEndpoint: /api/customers
enabledMethods: [GET, POST, PUT, DELETE]

# Repositorio
repoUrl: github.com?owner=Miguna&repo=customer-service
```

### **3. Generar Proyecto**

- Click **"Create"**
- Espera la generación
- ¡Tu proyecto estará listo! 🎉

---

## 💻 Paso 3: Setup Local

### **1. Clonar el Proyecto Generado**

```bash
git clone https://github.com/Miguna/customer-service
cd customer-service
```

### **2. Instalar Dependencias**

```bash
npm install
```

### **3. Configurar Variables de Entorno**

```bash
# Crear archivo .env
cat > .env << EOF
TABLE_NAME=Customers_STD
REGION=us-east-1
ENDPOINT_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=fake
AWS_SECRET_ACCESS_KEY=fake
EOF
```

### **4. Setup DynamoDB Local**

```bash
# Descargar DynamoDB Local (solo primera vez)
curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Ejecutar DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb &

# Crear tabla
aws dynamodb create-table \
  --table-name Customers_STD \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --endpoint-url http://localhost:8000
```

---

## 🖥️ Paso 4: Ejecutar y Probar

### **1. Iniciar Servidor**

```bash
npm run local
```

Verás:
```
✅ customer-service server running
🚀 Server listening on port 3002
📡 API available at: http://localhost:3002/api/customers
🏥 Health check: http://localhost:3002/health
```

### **2. Verificar Health Check**

```bash
curl http://localhost:3002/health
```

Respuesta:
```json
{
  "status": "healthy",
  "service": "customer-service",
  "version": "1.0.0",
  "timestamp": "2023-10-15T10:30:00Z",
  "endpoints": [
    "GET /api/customers",
    "POST /api/customers",
    "PUT /api/customers/:id",
    "DELETE /api/customers/:id"
  ]
}
```

### **3. Probar CRUD con Scripts**

```bash
# Hacer ejecutable
chmod +x api-test-scripts.sh

# Demo completo
./api-test-scripts.sh demo
```

Verás:
```
🚀 [2023-10-15 10:30:00] Iniciando demo completo de CRUD para Customer...

✅ Health Check - Success (200)
✅ Crear Customer (ID: demo001) - Success (201)
✅ Crear Customer (ID: demo002) - Success (201)
✅ Listar Customers - Success (200)
✅ Obtener Customer (ID: demo001) - Success (200)
✅ Actualizar Customer (ID: demo002) - Success (200)
✅ Eliminar Customer (ID: demo003) - Success (204)

🎉 Demo completo finalizado!
```

---

## 🧪 Paso 5: Testing Avanzado

### **Testing con Postman**

1. **Abrir Postman**
2. **Import → File → `postman-collection.json`**
3. **Configurar variables**:
   - `baseUrl`: `http://localhost:3002`
   - `entityId`: `001`
4. **Run Collection** para tests automáticos

### **Testing Individual**

```bash
# Crear customer
./api-test-scripts.sh create 123 "Juan Pérez"

# Obtener customer
./api-test-scripts.sh get 123

# Actualizar customer
./api-test-scripts.sh update 123 "Juan Carlos Pérez"

# Eliminar customer
./api-test-scripts.sh delete 123
```

### **Test de Stress**

```bash
# 50 requests concurrentes
./api-test-scripts.sh stress 50
```

---

## 📚 Paso 6: Explorar Documentación

### **TechDocs en Backstage**

1. Ve a tu proyecto en Backstage
2. Click en **"Docs"**
3. Navega por la documentación automática

### **Documentación Local**

```bash
# Instalar MkDocs (opcional)
pip install mkdocs-material

# Servir docs localmente
mkdocs serve

# Ver en: http://localhost:8000
```

---

## 🚀 Paso 7: Deploy a AWS (Opcional)

### **1. Comprimir función**

```bash
zip -r CustomerManagement.zip CustomerManagement/ events/ package.json
```

### **2. Crear función Lambda**

```bash
aws lambda create-function \
  --function-name CustomerManagement \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT-ID:role/CustomerManagementRole \
  --handler CustomerManagement/index.handler \
  --zip-file fileb://CustomerManagement.zip \
  --environment Variables='{"TABLE_NAME":"Customers_STD","REGION":"us-east-1"}'
```

### **3. Crear tabla DynamoDB real**

```bash
aws dynamodb create-table \
  --table-name Customers_STD \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

---

## ✅ ¡Felicitaciones!

Has completado exitosamente:

- ✅ Configurado template en Backstage
- ✅ Generado tu primer servicio
- ✅ Setup completo de desarrollo local
- ✅ Testing automático funcionando
- ✅ Documentación explorada
- ✅ (Opcional) Deploy a AWS

## 🎯 Próximos Pasos

1. **Personalizar**: Modifica el código generado según tus necesidades
2. **Extender**: Añade nuevos endpoints o funcionalidad
3. **Integrar**: Conecta con otros servicios
4. **Monitorear**: Añade logging y métricas
5. **Documentar**: Actualiza la documentación específica

## 🆘 ¿Problemas?

- 📋 [Troubleshooting](reference/troubleshooting.md)
- 💬 [GitHub Issues](https://github.com/Miguna/Apilambda-Template/issues)
- 📧 Contacto: desarrollo@miguna.dev

**¡Ya estás listo para desarrollar servicios serverless a toda velocidad! 🚀**