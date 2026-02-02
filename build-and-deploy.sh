#!/bin/bash

set -e

DEPLOY_HOST="root@46.62.250.143"
DEPLOY_PATH="/dades/www/app"

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

# Leer versión actual del package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: ${CURRENT_VERSION}"

# Incrementar versión automáticamente (minor por defecto)
# Acepta parámetro opcional: patch, minor, major
VERSION_TYPE="${1:-minor}"

# Función para incrementar versión
increment_version() {
  local version=$1
  local type=$2
  local major minor patch
  
  IFS='.' read -r major minor patch <<< "$version"
  
  case $type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "❌ Error: Tipo de versión inválido. Usa: patch, minor o major"
      exit 1
      ;;
  esac
  
  echo "${major}.${minor}.${patch}"
}

# Incrementar versión
VERSION=$(increment_version "$CURRENT_VERSION" "$VERSION_TYPE")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_TAG="${VERSION}-${TIMESTAMP}"

# Extraer major.minor para el tag (1.0, 1.1, etc.)
MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
GIT_TAG="${MAJOR_MINOR}"

echo "🚀 Incrementing version: ${CURRENT_VERSION} → ${VERSION} (${VERSION_TYPE})"
echo "📦 Building scrum-store app..."
echo "📋 New version: ${VERSION}"
echo "🏷️  Build tag: ${BUILD_TAG}"
echo "🏷️  Git tag: ${GIT_TAG}"
echo "🌿 Current branch: ${CURRENT_BRANCH}"
echo ""

# Actualizar package.json con la nueva versión
echo "📝 Updating package.json version..."
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '${VERSION}';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo "✅ package.json updated to version ${VERSION}"

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
echo "✅ version.json updated"

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

# Commit, tag y push al final (solo si todo fue bien)
echo ""
echo "📝 Committing changes (package.json + version.json)..."
cd "$SCRIPT_DIR"
if [ -d ".git" ]; then
  # Añadir package.json y version.json al staging
  git add package.json version.json
  
  # Commit con todos los cambios (usando major.minor)
  git commit -m "chore: bump version to ${GIT_TAG} (${VERSION_TYPE})" || {
    echo "⚠️  Warning: No hay cambios para commitear"
  }

  # Crear tag si no existe
  if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    echo "⚠️  Warning: El tag ${GIT_TAG} ya existe. Eliminando tag local para recrearlo..."
    git tag -d "${GIT_TAG}" 2>/dev/null || true
  fi
  
  echo "🏷️  Creating git tag: ${GIT_TAG}"
  git tag -a "${GIT_TAG}" -m "Release ${GIT_TAG} - ${TIMESTAMP}"
  
  # Hacer push del commit y tag al remoto
  echo "⬆️  Pushing commit and tag to remote..."
  git push origin HEAD || {
    echo "❌ Error: No se pudo hacer push del commit."
    exit 1
  }
  git push origin "${GIT_TAG}" || {
    echo "❌ Error: No se pudo hacer push del tag."
    exit 1
  }
  echo "✅ Commit and tag pushed successfully!"
else
  echo "⚠️  Warning: No se encontró repositorio git en el proyecto"
fi

echo ""
echo "🎉 All done! Version ${VERSION} deployed successfully!"

