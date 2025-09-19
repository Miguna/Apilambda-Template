#!/bin/bash

# ============================================
# ${{ values.projectName | title }} API Test Scripts
# ============================================
#
# Descripción: ${{ values.description }}
# Entidad: ${{ values.entityName }}
# Tabla DynamoDB: ${{ values.tableName }}
# Base URL: http://localhost:3002${{ values.baseEndpoint }}
#
# Uso:
#   ./api-test-scripts.sh health          # Health check
#   ./api-test-scripts.sh create          # Crear ${{ values.entityName | lower }}
#   ./api-test-scripts.sh list            # Listar todos
#   ./api-test-scripts.sh get <ID>        # Obtener por ID
#   ./api-test-scripts.sh update <ID>     # Actualizar
#   ./api-test-scripts.sh delete <ID>     # Eliminar
#   ./api-test-scripts.sh demo            # Demo completo
#   ./api-test-scripts.sh stress          # Test de stress
#
# ============================================

# Configuración
BASE_URL="http://localhost:3002"
API_ENDPOINT="${BASE_URL}${{ values.baseEndpoint }}"
ENTITY_NAME="${{ values.entityName }}"
TABLE_NAME="${{ values.tableName }}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Headers comunes
HEADERS="Content-Type: application/json"

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Función para hacer requests con logging
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4

    log "🚀 ${description}"
    echo -e "${PURPLE}${method} ${url}${NC}"

    if [ -n "$data" ]; then
        echo -e "${YELLOW}Payload:${NC}"
        echo "$data" | jq '.' 2>/dev/null || echo "$data"
        echo ""

        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "$HEADERS" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi

    # Separar response body y status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')

    echo -e "${CYAN}Response (${http_code}):${NC}"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    echo ""

    # Log del resultado
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        log_success "${description} - Success (${http_code})"
    else
        log_error "${description} - Failed (${http_code})"
    fi

    echo "----------------------------------------"
    return $http_code
}

# Health Check
health_check() {
    log_info "Verificando estado del servidor..."
    make_request "GET" "${BASE_URL}/health" "" "Health Check"
}

{% for method in values.enabledMethods %}
{%- if method == 'POST' %}
# Crear ${{ values.entityName }}
create_entity() {
    local entity_id=${1:-$(date +%s)}
    local name=${2:-"Test ${{ values.entityName }} $(date +'%H:%M:%S')"}

    local payload=$(cat <<EOF
{
  "${{ values.pkAttribute }}": "${ENTITY_NAME}#${entity_id}",
  "${{ values.skAttribute }}": "METADATA",
  "name": "${name}",
  "description": "${{ values.entityName }} creado via script el $(date)",
  "status": "active",
  "metadata": {
    "source": "curl-script",
    "environment": "local",
    "created_by": "test-script"
  }
}
EOF
)

    make_request "POST" "$API_ENDPOINT" "$payload" "Crear ${{ values.entityName }} (ID: ${entity_id})"
    return $?
}
{%- endif %}

{%- if method == 'GET' %}
# Listar todos los ${{ values.entityName }}s
list_entities() {
    local pk_filter=$1
    local url="$API_ENDPOINT"

    if [ -n "$pk_filter" ]; then
        url="${url}?${{ values.pkAttribute }}=${pk_filter}"
    fi

    make_request "GET" "$url" "" "Listar ${{ values.entityName }}s"
}

# Obtener ${{ values.entityName }} por ID
get_entity() {
    local entity_id=$1

    if [ -z "$entity_id" ]; then
        log_error "ID requerido para obtener ${{ values.entityName | lower }}"
        echo "Uso: $0 get <ID>"
        return 1
    fi

    make_request "GET" "${API_ENDPOINT}/${entity_id}" "" "Obtener ${{ values.entityName }} (ID: ${entity_id})"
}
{%- endif %}

{%- if method == 'PUT' %}
# Actualizar ${{ values.entityName }}
update_entity() {
    local entity_id=$1
    local new_name=${2:-"Updated ${{ values.entityName }} $(date +'%H:%M:%S')"}

    if [ -z "$entity_id" ]; then
        log_error "ID requerido para actualizar ${{ values.entityName | lower }}"
        echo "Uso: $0 update <ID> [nuevo_nombre]"
        return 1
    fi

    local payload=$(cat <<EOF
{
  "name": "${new_name}",
  "description": "${{ values.entityName }} actualizado via script el $(date)",
  "status": "updated",
  "lastModifiedBy": "curl-script",
  "metadata": {
    "source": "curl-script",
    "operation": "update",
    "environment": "local",
    "updated_at": "$(date -Iseconds)"
  }
}
EOF
)

    make_request "PUT" "${API_ENDPOINT}/${entity_id}" "$payload" "Actualizar ${{ values.entityName }} (ID: ${entity_id})"
}
{%- endif %}

{%- if method == 'DELETE' %}
# Eliminar ${{ values.entityName }}
delete_entity() {
    local entity_id=$1

    if [ -z "$entity_id" ]; then
        log_error "ID requerido para eliminar ${{ values.entityName | lower }}"
        echo "Uso: $0 delete <ID>"
        return 1
    fi

    make_request "DELETE" "${API_ENDPOINT}/${entity_id}" "" "Eliminar ${{ values.entityName }} (ID: ${entity_id})"
}
{%- endif %}
{% endfor %}

# Demo completo de CRUD
demo_crud() {
    log_info "🎯 Iniciando demo completo de CRUD para ${{ values.entityName }}..."
    echo ""

    # 1. Health Check
    health_check
    sleep 1

{% if 'POST' in values.enabledMethods %}
    # 2. Crear entidades de prueba
    log_info "📝 Creando entidades de prueba..."
    create_entity "demo001" "Demo ${{ values.entityName }} 1"
    sleep 1
    create_entity "demo002" "Demo ${{ values.entityName }} 2"
    sleep 1
    create_entity "demo003" "Demo ${{ values.entityName }} 3"
    sleep 1
{% endif %}

{% if 'GET' in values.enabledMethods %}
    # 3. Listar todas las entidades
    log_info "📋 Listando todas las entidades..."
    list_entities
    sleep 1

    # 4. Obtener entidad específica
    log_info "🔍 Obteniendo entidad específica..."
    get_entity "demo001"
    sleep 1
{% endif %}

{% if 'PUT' in values.enabledMethods %}
    # 5. Actualizar entidad
    log_info "✏️  Actualizando entidad..."
    update_entity "demo002" "Demo ${{ values.entityName }} 2 - UPDATED"
    sleep 1
{% endif %}

{% if 'GET' in values.enabledMethods %}
    # 6. Verificar actualización
    log_info "🔍 Verificando actualización..."
    get_entity "demo002"
    sleep 1
{% endif %}

{% if 'DELETE' in values.enabledMethods %}
    # 7. Eliminar entidad
    log_info "🗑️  Eliminando entidad..."
    delete_entity "demo003"
    sleep 1

    # 8. Verificar eliminación
    log_info "🔍 Verificando eliminación..."
    get_entity "demo003"
    sleep 1
{% endif %}

{% if 'GET' in values.enabledMethods %}
    # 9. Listar entidades finales
    log_info "📋 Estado final de entidades..."
    list_entities
{% endif %}

    log_success "🎉 Demo completo finalizado!"
}

# Test de stress básico
stress_test() {
    local num_requests=${1:-10}
    log_info "🔥 Iniciando test de stress con ${num_requests} requests..."

    local success_count=0
    local error_count=0

    for i in $(seq 1 $num_requests); do
        log "Request ${i}/${num_requests}"

{% if 'POST' in values.enabledMethods %}
        if create_entity "stress_$(date +%s)_${i}" "Stress Test Entity ${i}"; then
            ((success_count++))
        else
            ((error_count++))
        fi
{% else %}
        if health_check; then
            ((success_count++))
        else
            ((error_count++))
        fi
{% endif %}

        sleep 0.1  # Pequeño delay entre requests
    done

    echo ""
    log_success "✅ Requests exitosos: ${success_count}"
    log_error "❌ Requests fallidos: ${error_count}"
    log_info "📊 Tasa de éxito: $((success_count * 100 / num_requests))%"
}

# Test de endpoint inválido
test_error_handling() {
    log_info "🧪 Probando manejo de errores..."

    # Endpoint inválido
    make_request "GET" "${BASE_URL}/invalid-endpoint" "" "Test endpoint inválido"

    # Método no soportado
    make_request "PATCH" "$API_ENDPOINT" "" "Test método no soportado"

{% if 'GET' in values.enabledMethods %}
    # Entidad inexistente
    make_request "GET" "${API_ENDPOINT}/nonexistent-id" "" "Test entidad inexistente"
{% endif %}

{% if 'POST' in values.enabledMethods %}
    # Payload inválido
    make_request "POST" "$API_ENDPOINT" '{"invalid": "payload"}' "Test payload inválido"
{% endif %}
}

# Mostrar ayuda
show_help() {
    echo -e "${CYAN}${{ values.projectName | title }} API Test Scripts${NC}"
    echo -e "${YELLOW}Descripción:${NC} ${{ values.description }}"
    echo -e "${YELLOW}Entidad:${NC} ${{ values.entityName }}"
    echo -e "${YELLOW}Tabla:${NC} ${{ values.tableName }}"
    echo -e "${YELLOW}Base URL:${NC} $API_ENDPOINT"
    echo ""
    echo -e "${CYAN}Comandos disponibles:${NC}"
    echo "  health                    - Health check del servidor"
{% for method in values.enabledMethods %}
{%- if method == 'POST' %}
    echo "  create [ID] [nombre]      - Crear ${{ values.entityName | lower }}"
{%- endif %}
{%- if method == 'GET' %}
    echo "  list [PK_filter]          - Listar ${{ values.entityName | lower }}s"
    echo "  get <ID>                  - Obtener ${{ values.entityName | lower }} por ID"
{%- endif %}
{%- if method == 'PUT' %}
    echo "  update <ID> [nombre]      - Actualizar ${{ values.entityName | lower }}"
{%- endif %}
{%- if method == 'DELETE' %}
    echo "  delete <ID>               - Eliminar ${{ values.entityName | lower }}"
{%- endif %}
{% endfor %}
    echo "  demo                      - Demo completo CRUD"
    echo "  stress [num_requests]     - Test de stress"
    echo "  errors                    - Test manejo de errores"
    echo "  help                      - Mostrar esta ayuda"
    echo ""
    echo -e "${CYAN}Ejemplos:${NC}"
{% if 'POST' in values.enabledMethods %}
    echo "  $0 create 123 'Mi ${{ values.entityName }}'"
{% endif %}
{% if 'GET' in values.enabledMethods %}
    echo "  $0 get 123"
{% endif %}
{% if 'PUT' in values.enabledMethods %}
    echo "  $0 update 123 'Nuevo nombre'"
{% endif %}
    echo "  $0 demo"
    echo "  $0 stress 20"
}

# Función principal
main() {
    local command=$1
    shift  # Remover el primer argumento

    case "$command" in
        "health")
            health_check
            ;;
{% for method in values.enabledMethods %}
{%- if method == 'POST' %}
        "create")
            create_entity "$@"
            ;;
{%- endif %}
{%- if method == 'GET' %}
        "list")
            list_entities "$@"
            ;;
        "get")
            get_entity "$@"
            ;;
{%- endif %}
{%- if method == 'PUT' %}
        "update")
            update_entity "$@"
            ;;
{%- endif %}
{%- if method == 'DELETE' %}
        "delete")
            delete_entity "$@"
            ;;
{%- endif %}
{% endfor %}
        "demo")
            demo_crud
            ;;
        "stress")
            stress_test "$@"
            ;;
        "errors")
            test_error_handling
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Comando desconocido: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Verificar dependencias
check_dependencies() {
    local missing_deps=()

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        log_warning "jq no encontrado - el formato JSON será menos legible"
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Dependencias faltantes: ${missing_deps[*]}"
        log_info "Por favor instala las dependencias faltantes:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
}

# Verificar que el servidor esté corriendo
check_server() {
    if ! curl -s "${BASE_URL}/health" > /dev/null; then
        log_error "El servidor no está corriendo en ${BASE_URL}"
        log_info "Por favor ejecuta: npm run local"
        exit 1
    fi
}

# Punto de entrada principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Verificaciones iniciales
    check_dependencies

    # Si no es el comando help, verificar servidor
    if [[ "$1" != "help" && "$1" != "--help" && "$1" != "-h" ]]; then
        check_server
    fi

    # Ejecutar comando principal
    main "$@"
fi