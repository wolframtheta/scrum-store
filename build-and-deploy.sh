#!/bin/bash

set -e

DEPLOY_HOST="root@46.62.250.143"
DEPLOY_PATH="/dades/scrum-store"

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
  echo "❌ Error: No se encontró un repositorio git en este directorio"
  exit 1
fi

# Verificar que estamos en una rama válida
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
  echo "❌ Error: No se pudo determinar la rama actual"
  exit 1
fi

# Leer versión del package.json
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_TAG="${VERSION}-${TIMESTAMP}"

# Extraer major.minor para el tag (1.0, 1.1, etc.)
MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
GIT_TAG="${MAJOR_MINOR}"

echo "📦 Building scrum-store app..."
echo "📋 Version: ${VERSION}"
echo "🏷️  Build tag: ${BUILD_TAG}"
echo "🏷️  Git tag: ${GIT_TAG}"
echo "🌿 Current branch: ${CURRENT_BRANCH}"
echo ""

# Usar version.json local del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/version.json"

# Crear o actualizar version.json local
cat > "$VERSION_FILE" <<EOF
{
  "version": "${VERSION}",
  "buildTag": "${BUILD_TAG}",
  "timestamp": "${TIMESTAMP}"
}
EOF

# Copiar version.json a assets antes del build
if [ -f "$VERSION_FILE" ]; then
  mkdir -p src/assets
  cp "$VERSION_FILE" src/assets/version.json
  echo "📋 Copied version.json to assets"
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
fi

# Build de producción
echo "🔨 Building for production..."
npm run build

# Verificar que el build se completó
if [ ! -d "www" ]; then
  echo "❌ Error: Build directory 'www' not found!"
  exit 1
fi

# Crear archivo de versión en el build
echo "${BUILD_TAG}" > www/.version
echo "Version: ${BUILD_TAG}" > www/VERSION.txt
if [ -f "$VERSION_FILE" ]; then
  cp "$VERSION_FILE" www/assets/version.json 2>/dev/null || true
fi

echo "📤 Deploying to ${DEPLOY_HOST}:${DEPLOY_PATH}..."
rsync -avz --delete www/ ${DEPLOY_HOST}:${DEPLOY_PATH}/

echo "✅ Deploy completed!"
echo "📋 Version deployed: ${BUILD_TAG}"
echo "🌐 App available at: http://46.62.250.143/scrum-store/"

# Eliminar version.json de assets (ya está en el build)
if [ -f "src/assets/version.json" ]; then
  rm src/assets/version.json
  echo "🧹 Cleaned up src/assets/version.json"
fi

# Commit y tag del version.json al final (solo si todo fue bien)
echo ""
echo "📝 Committing version.json..."
cd "$SCRIPT_DIR"
if [ -d ".git" ]; then
  git add version.json
  git commit -m "chore: update app version to ${GIT_TAG}" || {
    echo "⚠️  Warning: No hay cambios para commitear en version.json"
  }

  # Crear tag si no existe
  if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    echo "⚠️  Warning: El tag ${GIT_TAG} ya existe. Usando tag existente."
  else
    echo "🏷️  Creating git tag: ${GIT_TAG}"
    git tag -a "${GIT_TAG}" -m "Release ${GIT_TAG} - ${TIMESTAMP}"
    
    # Hacer push del commit y tag al remoto
    echo "⬆️  Pushing commit and tag to remote..."
    git push origin HEAD || {
      echo "⚠️  Warning: No se pudo hacer push del commit."
    }
    git push origin "${GIT_TAG}" || {
      echo "⚠️  Warning: No se pudo hacer push del tag."
    }
  fi
else
  echo "⚠️  Warning: No se encontró repositorio git en el proyecto"
fi

