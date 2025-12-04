# Tech Stack & Configuration - App Mobile

## Tecnologías Principales

- **Ionic**: v8.x - Framework móvil híbrido
- **Angular**: v20.x - Framework web
- **Capacitor**: v7.x - Bridge nativo
- **TypeScript**: v5.9+
- **Bulma CSS**: Framework CSS
- **@ngx-translate**: Sistema i18n

## Capacitor Plugins

- **@capacitor/camera**: Cámara y galería
- **@capacitor/preferences**: Storage local
- **@capacitor/haptics**: Feedback háptico
- **@capacitor/status-bar**: Control status bar
- **@capacitor/keyboard**: Gestión teclado
- **@capacitor/app**: Lifecycle

---

## Configuración de Entornos

### environment.ts (Development)
- apiUrl: URL del backend local
- s3BaseUrl: URL base de S3
- defaultLanguage: 'ca'
- tokenExpiresIn: Tiempo en ms

### environment.prod.ts (Production)
- apiUrl: URL del backend producción
- Resto igual a development

---

## Configuración de Aplicación

### app.config.ts

Configurar providers:
- Router
- HttpClient con interceptores
- provideIonicAngular()
- TranslateModule con loader

**Interceptores a registrar:**
- authInterceptor (añade Bearer token)
- errorInterceptor (gestiona errores)

### Loader de traducciones
- TranslateHttpLoader apuntando a `assets/i18n/`
- Idioma por defecto: catalán
- Fallback a catalán si falta traducción

---

## Configuración de Estilos

### styles.scss

Importar en orden:
1. Core CSS de Ionic
2. Bulma CSS
3. Variables personalizadas
4. Overrides de Bulma
5. Estilos custom

### theme/variables.scss
- Variables CSS de Ionic
- Colores personalizados

### theme/bulma-overrides.scss
- Colores de Bulma para match con Ionic
- Primary, info, success, warning, danger

### theme/custom.scss
- Estilos globales personalizados
- Clases de utilidad

---

## Configuración de Capacitor

### capacitor.config.ts

Configurar:
- appId: Identificador único de la app
- appName: Nombre de la app
- webDir: 'www' (output de Angular)
- bundledWebRuntime: false

**Plugins a configurar:**
- SplashScreen: Duración, color
- Camera: Permisos y descripciones

---

## Internacionalización

### Estructura de traducciones

Crear archivos JSON en `assets/i18n/`:
- `ca.json` - Catalán (por defecto)
- `es.json` - Castellano

**Organización por secciones:**
- COMMON: Textos comunes (save, cancel, etc.)
- AUTH: Login, registro
- SHOWCASE: Aparador
- CART: Cistella
- GROUP: Perfil del grupo
- PROFILE: Perfil usuario
- MESSAGES: Muro
- ORDERS: Pedidos

### Uso en componentes
- Inyectar TranslateService
- Usar pipe translate en templates
- Cambiar idioma dinámicamente
- Persistir preferencia en storage

---

## Storage Keys

Definir constantes para keys de Preferences:
- ACCESS_TOKEN
- REFRESH_TOKEN
- CURRENT_USER
- CURRENT_GROUP
- LANGUAGE
- CART_PREFIX (cart_{groupId})

---

## Routing

### app.routes.ts

Estructura de rutas:
- `/auth` - Login y registro (sin guards)
- `/tabs` - Rutas principales con AuthGuard y HasGroupGuard
  - showcase, cart, group, profile
- Redirect por defecto a `/tabs/showcase`

### Configuración de Tabs
- Componente TabsPage con ion-tabs
- 4 tabs con iconos y labels
- Badge en cart con cantidad de items

---

## Servicios Core

### StorageService
- Wrapper de Capacitor Preferences
- Métodos: set, get, remove, clear
- Serialización JSON automática

### ApiService
- Métodos HTTP genéricos
- BaseURL desde environment
- Gestión de errores
- Upload de archivos multipart

### AuthService
- Login, registro, logout
- Signals para estado
- Refresh automático de token
- Persistencia en storage

### CartService
- Signal de items del carrito
- Computed de totales
- Métodos CRUD de items
- Persistir por grupo
- Checkout (llamada a API)

### ConsumerGroupService
- Signal de grupos del usuario
- Signal de grupo actual
- Método para calcular si está abierto
- Cambiar grupo actual

---

## Guards

### authGuard (CanActivateFn)
- Verificar isAuthenticated
- Redirigir a login si no

### hasGroupGuard (CanActivateFn)
- Cargar grupos del usuario
- Verificar que tenga al menos uno
- Modal para seleccionar si no tiene

---

## Interceptores

### authInterceptor
- Obtener token de storage
- Añadir header Authorization
- Solo si hay token

### errorInterceptor
- Capturar HttpErrorResponse
- Si 401: intentar refresh token
- Si otros: mostrar toast
- Logging de errores

---

## Componentes Reutilizables

### ArticleCard
- Mostrar info de artículo
- Click abre modal de cantidad

### QuantityModal
- Input según unidad de medida
- Calcular precio total
- Confirmar y añadir al carrito

### CartItem
- Mostrar item del carrito
- Click edita cantidad
- Swipe elimina

### MessageItem
- Avatar, nombre, contenido
- Alineación según remitente
- Badge si es gestor

### GroupSelector
- Dropdown de grupos
- Cambiar grupo actual

---

## Capacitor: Uso de Plugins

### Camera
- getPhoto con opciones
- Comprimir antes de upload
- Base64 o URI según necesidad

### Preferences
- set/get con await
- JSON.stringify/parse automático
- Manejo de errores

### Haptics
- impact() en acciones importantes
- notification() en éxitos/errores

---

## Convenciones de Código

### Nomenclatura
- Componentes: kebab-case
- Servicios: kebab-case + .service
- Interfaces: PascalCase
- Signals: camelCase

### Estructura de Componente
- Standalone: true (por defecto en Angular 20)
- ChangeDetection: OnPush
- Imports explícitos
- Signals para estado
- Inject() en lugar de constructor

---

## Scripts NPM

- `start` - Desarrollo web
- `build` - Build web
- `build:prod` - Build producción
- `cap:sync` - Sincronizar con Capacitor
- `cap:ios` - Abrir Xcode
- `cap:android` - Abrir Android Studio

---

## Buenas Prácticas

### Performance
- ChangeDetection OnPush
- TrackBy en ngFor
- Lazy loading de páginas
- Optimizar imágenes

### UX
- Loading spinners
- Toasts para feedback
- Pull to refresh
- Haptic feedback
- Skeleton screens

### Offline
- Detectar conexión
- Mensaje si no hay red
- Persistir carrito localmente

### Accesibilidad
- Labels en inputs
- ARIA attributes
- Contraste adecuado
- Tamaños táctiles mínimos
