#!/bin/bash

read -p "Nome do módulo (plural): " MODULE_PLURAL

# Converte para singular
if [[ $MODULE_PLURAL == *ies ]]; then
  MODULE_SINGULAR="${MODULE_PLURAL%ies}y"
elif [[ $MODULE_PLURAL == *s ]]; then
  MODULE_SINGULAR="${MODULE_PLURAL%s}"
else
  MODULE_SINGULAR=$MODULE_PLURAL
fi

BASE_DIR="src/modules/$MODULE_PLURAL"

mkdir -p "$BASE_DIR"/{events,application/{services,dtos,ports},infrastructure/{persistence,http/controllers}}

touch "$BASE_DIR/events/${MODULE_SINGULAR}.events.ts"
touch "$BASE_DIR/application/dtos/${MODULE_SINGULAR}.dto.ts"
touch "$BASE_DIR/application/ports/${MODULE_SINGULAR}.port.ts"
touch "$BASE_DIR/application/services/${MODULE_SINGULAR}.service.ts"
touch "$BASE_DIR/infrastructure/persistence/${MODULE_SINGULAR}.repository.ts"
touch "$BASE_DIR/infrastructure/http/controllers/${MODULE_SINGULAR}.controller.ts"

echo "✅ Módulo $MODULE_PLURAL criado em $BASE_DIR"
tree "$BASE_DIR" 2>/dev/null || find "$BASE_DIR" -type f
