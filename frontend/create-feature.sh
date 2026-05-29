#!/usr/bin/env bash

read -p "Nome da feature: " MODULE_PLURAL

if [[ -z "$MODULE_PLURAL" ]]; then
  echo "Nome da feature não pode ser vazio"
  exit 1
fi

if [[ $MODULE_PLURAL == *ies ]]; then
  MODULE_SINGULAR="${MODULE_PLURAL%ies}y"
elif [[ $MODULE_PLURAL == *s ]]; then
  MODULE_SINGULAR="${MODULE_PLURAL%s}"
else
  MODULE_SINGULAR="$MODULE_PLURAL"
fi

BASE_DIR="src/modules/$MODULE_PLURAL"

mkdir -p "$BASE_DIR"/{pages,hooks,components}

touch "$BASE_DIR/hooks/${MODULE_SINGULAR}.api.ts"
touch "$BASE_DIR/pages/${MODULE_SINGULAR}-page.ts"

echo "✅ Módulo $MODULE_PLURAL criado em $BASE_DIR"
tree "$BASE_DIR" 2>/dev/null || find "$BASE_DIR"
