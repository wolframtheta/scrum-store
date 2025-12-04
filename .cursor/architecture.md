# Arquitectura App Mobile - Scrum Store

## Visión General

Aplicación móvil híbrida con Ionic + Angular para que los clientes de grupos de consumo puedan ver el catálogo, hacer pedidos y gestionar su perfil.

## Stack Tecnológico

- **Framework**: Ionic 8 + Angular 20
- **UI Framework**: Bulma CSS
- **i18n**: @ngx-translate (Catalán por defecto, Castellano)
- **Capacitor**: Plugins nativos (Camera, Preferences, Haptics)
- **State Management**: Angular Signals
- **Routing**: Angular Router con tabs

## Estructura de la Aplicación

```
src/
├── app/
│   ├── core/                    # Singleton services y guards
│   │   ├── services/            # Auth, API, Storage
│   │   ├── guards/              # Auth, HasGroup
│   │   ├── interceptors/        # Auth, Error
│   │   └── models/              # Interfaces globales
│   ├── shared/                  # Componentes compartidos
│   │   ├── components/
│   │   ├── pipes/
│   │   └── directives/
│   ├── features/                # Features de la app
│   │   ├── auth/                # Login, Registro
│   │   ├── showcase/            # Aparador
│   │   ├── cart/                # Cistella
│   │   ├── group/               # Perfil del grupo
│   │   ├── messages/            # Muro
│   │   └── profile/             # Perfil usuario
├── assets/
│   ├── i18n/                    # Traducciones ca.json, es.json
│   └── images/
├── theme/                       # Estilos CSS
└── environments/                # Configuración entornos
```

## Características Principales

### Standalone Components
- Todos los componentes sin NgModules
- ChangeDetection OnPush
- Imports explícitos

### State Management con Signals
- Signals para estado reactivo
- Computed para valores derivados
- Sin necesidad de RxJS Subject/BehaviorSubject

### Routing con Tabs
- Estructura con ion-tabs
- 4 tabs principales: Aparador, Cistella, Grup, Perfil
- Lazy loading de páginas
- Guards para protección de rutas

## Servicios Core

### AuthService
- Login/Registro/Logout
- Gestión de tokens (access + refresh)
- Signal de usuario actual
- Auto-refresh de tokens

### ApiService
- Métodos HTTP genéricos (get, post, patch, delete)
- Upload de archivos
- Gestión de errores centralizada

### StorageService
- Wrapper de Capacitor Preferences
- Almacenamiento de tokens, carrito, idioma
- Keys constantes centralizadas

### CartService
- Estado del carrito con signals
- Añadir/editar/eliminar items
- Calcular totales
- Persistencia local por grupo
- Checkout (crear venta)

### ConsumerGroupService
- Grupos del usuario
- Grupo actual seleccionado
- Calcular si está abierto según horario

## Guards

### authGuard
- Verificar token válido
- Redirigir a login si no autenticado

### hasGroupGuard
- Verificar que el usuario tenga al menos un grupo
- Mostrar modal para seleccionar/unirse si no tiene

## Interceptores

### authInterceptor
- Añadir Bearer token a requests

### errorInterceptor
- Gestión de errores 401 (refresh token)
- Mostrar toasts para errores

## Internacionalización

### Configuración
- @ngx-translate con TranslateModule
- Loader de archivos JSON
- Idioma por defecto: Catalán
- Idioma secundario: Castellano

### Archivos de traducción
- `assets/i18n/ca.json` - Todas las traducciones en catalán
- `assets/i18n/es.json` - Todas las traducciones en castellano
- Organización por secciones (COMMON, AUTH, SHOWCASE, etc.)

## Capacitor Plugins

### Camera
- Tomar fotos o seleccionar de galería
- Para imagen de perfil y mensajes

### Preferences
- Storage local persistente
- Tokens, usuario, idioma, carrito

### Haptics
- Feedback táctil en acciones importantes

### Status Bar y Keyboard
- Control de UI nativa

## Componentes Principales

### Showcase (Aparador)
- Grid de artículos
- Modal para seleccionar cantidad
- Añadir al carrito

### Cart (Cistella)
- Lista de items
- Editar cantidad (modal)
- Swipe para eliminar
- Botón tramitar comanda

### Group Profile
- Banner con info del grupo
- Indicador si está abierto/cerrado
- Muro de publicaciones
- Detalle: horarios, miembros, descripción

### User Profile
- Datos personales
- Historial de pedidos
- Ajustes (idioma)
- Cerrar sesión

### Messages Wall
- Lista de mensajes
- Input para escribir
- Adjuntar imagen
- Distinguir propios/otros
- Badge "Gestor" si aplica

## Flujo de Autenticación

1. App inicia → Verificar token en storage
2. Si no hay token → Login
3. Si hay token → Verificar validez
4. Si expirado → Refresh automático
5. Cargar grupos del usuario
6. Seleccionar grupo (por defecto o último usado)
7. Navegar a Showcase

## Persistencia Local

- **Tokens**: Capacitor Preferences
- **Carrito**: Por grupo (key: `cart_{groupId}`)
- **Idioma**: Preferencia del usuario
- **Grupo actual**: Último seleccionado

## Integración Bulma CSS

- Importar Bulma en styles.scss
- Usar clases de Bulma para layout y componentes
- Combinar con componentes de Ionic
- Personalización de colores

## Principios de Diseño

1. **Mobile First**: Optimizado para móvil
2. **Offline-aware**: Gestión de errores de conexión
3. **Performance**: Lazy loading, OnPush
4. **UX**: Feedback inmediato (loading, toasts)
5. **Accesibilidad**: Labels, ARIA, contraste
