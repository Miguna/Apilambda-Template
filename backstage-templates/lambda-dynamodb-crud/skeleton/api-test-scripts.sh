#!/bin/bash

# ============================================
# ${{ values.projectName | title }} API Test Scripts
# ============================================
#
# Descripción: ${{ values.description }}
# Entidad: ${{ values.entityName }}
# Base URL: http://localhost:3002${{ values.baseEndpoint }}
#
# Uso:
#   ./api-test-scripts.sh health          # Health check
#   ./api-test-scripts.sh demo            # Demo completo
#
# ============================================

# Configuración
BASE_URL="http://localhost:3002"
API_ENDPOINT="${BASE_URL}${{ values.baseEndpoint }}"
ENTITY_NAME="${{ values.entityName }}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Función para hacer requests
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4

    log "🚀 ${description}"
    echo -e "Request: ${method} ${url}"

    if [ -n "$data" ]; then
        echo "Data: $data"
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi

    # Separar response body y status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')

    echo "Response (${http_code}): $response_body"
    echo "----------------------------------------"

    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        log_success "${description} - Success (${http_code})"
    else
        log_error "${description} - Failed (${http_code})"
    fi

    return $http_code
}

# Health Check
health_check() {
    make_request "GET" "${BASE_URL}/health" "" "Health Check"
}

# Crear entidad
create_entity() {
    local entity_id=${1:-$(date +%s)}
    local name=${2:-"Test ${{ values.entityName }} $(date +'%H:%M:%S')"}

    local payload='{
  "${{ values.pkAttribute }}": "'${ENTITY_NAME}'#'${entity_id}'",
  "${{ values.skAttribute }}": "METADATA",
  "name": "'${name}'",
  "description": "'${{ values.entityName }}' creado via script el '$(date)'"
}'

    make_request "POST" "$API_ENDPOINT" "$payload" "Crear ${{ values.entityName }} (ID: ${entity_id})"
}

# Obtener entidad
get_entity() {
    local entity_id=${1:-"001"}
    make_request "GET" "${API_ENDPOINT}/${entity_id}" "" "Obtener ${{ values.entityName }} (ID: ${entity_id})"
}

# Listar entidades
list_entities() {
    make_request "GET" "$API_ENDPOINT" "" "Listar ${{ values.entityName }}s"
}

# Actualizar entidad
update_entity() {
    local entity_id=${1:-"001"}
    local new_name=${2:-"Updated ${{ values.entityName }} $(date +'%H:%M:%S')"}

    local payload='{
  "name": "'${new_name}'",
  "description": "'${{ values.entityName }}' actualizado via script el '$(date)'"
}'

    make_request "PUT" "${API_ENDPOINT}/${entity_id}" "$payload" "Actualizar ${{ values.entityName }} (ID: ${entity_id})"
}

# Eliminar entidad
delete_entity() {
    local entity_id=${1:-"001"}
    make_request "DELETE" "${API_ENDPOINT}/${entity_id}" "" "Eliminar ${{ values.entityName }} (ID: ${entity_id})"
}

# Demo completo de CRUD
demo_crud() {
    log "🎯 Iniciando demo completo de CRUD para ${{ values.entityName }}..."
    echo ""

    # 1. Health Check
    health_check
    sleep 1

    # 2. Crear entidades de prueba
    create_entity "demo001" "Demo ${{ values.entityName }} 1"
    sleep 1
    create_entity "demo002" "Demo ${{ values.entityName }} 2"
    sleep 1

    # 3. Listar todas las entidades
    list_entities
    sleep 1

    # 4. Obtener entidad específica
    get_entity "demo001"
    sleep 1

    # 5. Actualizar entidad
    update_entity "demo002" "Demo ${{ values.entityName }} 2 - UPDATED"
    sleep 1

    # 6. Verificar actualización
    get_entity "demo002"
    sleep 1

    # 7. Eliminar entidad
    delete_entity "demo001"
    sleep 1

    # 8. Listar entidades finales
    list_entities

    log_success "🎉 Demo completo finalizado!"
}

# Mostrar ayuda
show_help() {
    echo "Comandos disponibles:"
    echo "  health                    - Health check del servidor"
    echo "  create [ID] [nombre]      - Crear ${{ values.entityName | lower }}"
    echo "  get [ID]                  - Obtener ${{ values.entityName | lower }} por ID"
    echo "  list                      - Listar ${{ values.entityName | lower }}s"
    echo "  update [ID] [nombre]      - Actualizar ${{ values.entityName | lower }}"
    echo "  delete [ID]               - Eliminar ${{ values.entityName | lower }}"
    echo "  demo                      - Demo completo CRUD"
    echo "  help                      - Mostrar esta ayuda"
}

# Función principal
main() {
    local command=$1
    shift

    case "$command" in
        "health")
            health_check
            ;;
        "create")
            create_entity "$@"
            ;;
        "get")
            get_entity "$@"
            ;;
        "list")
            list_entities
            ;;
        "update")
            update_entity "$@"
            ;;
        "delete")
            delete_entity "$@"
            ;;
        "demo")
            demo_crud
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Comando desconocido: $command"
            show_help
            exit 1
            ;;
    esac
}

# Verificar que el servidor esté corriendo
check_server() {
    if ! curl -s "${BASE_URL}/health" > /dev/null; then
        log_error "El servidor no está corriendo en ${BASE_URL}"
        echo "Por favor ejecuta: npm run local"
        exit 1
    fi
}

# Punto de entrada principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Si no es el comando help, verificar servidor
    if [[ "$1" != "help" && "$1" != "--help" && "$1" != "-h" ]]; then
        check_server
    fi

    # Ejecutar comando principal
    main "$@"
fi