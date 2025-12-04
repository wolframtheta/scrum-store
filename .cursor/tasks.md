# Tareas App Mobile - Scrum Store

## Fase 1: Setup Inicial y Configuración

### 1.1 Instalación de Dependencias
- [ ] Instalar dependencias principales:
  - @ngx-translate/core + @ngx-translate/http-loader
  - bulma (CSS framework)
  - @capacitor/camera
  - @capacitor/preferences
  - @capacitor/haptics
  - @capacitor/status-bar
  - @capacitor/keyboard
- [ ] Configurar Capacitor para iOS y Android
- [ ] Configurar estructura de carpetas según arquitectura

### 1.2 Configuración de Entorno
- [ ] Crear `environment.ts` y `environment.prod.ts`:
  - API_URL (backend endpoint)
  - AWS_S3_BASE_URL
  - DEFAULT_LANGUAGE
- [ ] Configurar variables de compilación en `angular.json`

### 1.3 Configuración de Estilos
- [ ] Importar Bulma CSS en `styles.scss`
- [ ] Crear `theme/bulma-overrides.scss` con colores personalizados
- [ ] Configurar variables CSS de Ionic en `theme/variables.scss`
- [ ] Crear estilos globales en `theme/custom.scss`

### 1.4 Internacionalización (i18n)
- [ ] Configurar @ngx-translate en `app.config.ts`
- [ ] Crear `assets/i18n/ca.json` (Catalán - por defecto)
- [ ] Crear `assets/i18n/es.json` (Castellano)
- [ ] Traducir todos los textos de la interfaz

---

## Fase 2: Core - Servicios Fundamentales ⭐ PRIORIDAD 1

### 2.1 StorageService
- [ ] Crear `core/services/storage.service.ts`
- [ ] Implementar métodos con Capacitor Preferences:
  - set(key, value)
  - get(key)
  - remove(key)
  - clear()
- [ ] Crear constantes para keys (TOKEN, REFRESH_TOKEN, LANGUAGE, CART, CURRENT_GROUP)

### 2.2 ApiService
- [ ] Crear `core/services/api.service.ts`
- [ ] Implementar métodos HTTP:
  - get<T>(endpoint)
  - post<T>(endpoint, body)
  - patch<T>(endpoint, body)
  - delete<T>(endpoint)
  - uploadFile(endpoint, file)
- [ ] Gestión de errores con try-catch y toasts

### 2.3 AuthService
- [ ] Crear `core/services/auth.service.ts`
- [ ] Implementar signals:
  - currentUser signal
  - isAuthenticated computed
- [ ] Métodos:
  - login(email, password)
  - register(userData)
  - logout()
  - refreshToken()
  - loadUserFromStorage()
- [ ] Auto-refresh token antes de expiración

### 2.4 Interceptores
- [ ] Crear `core/interceptors/auth.interceptor.ts`
  - Añadir Bearer token a todas las requests
- [ ] Crear `core/interceptors/error.interceptor.ts`
  - Gestión de errores 401 (refresh token)
  - Mostrar toasts para errores
- [ ] Registrar interceptores en `app.config.ts`

### 2.5 Guards
- [ ] Crear `core/guards/auth.guard.ts`
  - Verificar autenticación antes de acceder a rutas protegidas
- [ ] Crear `core/guards/has-group.guard.ts`
  - Verificar que el usuario tenga al menos un grupo
  - Redirigir a modal de selección si no tiene

### 2.6 Modelos/Interfaces
- [ ] Crear interfaces en `core/models/`:
  - user.interface.ts
  - consumer-group.interface.ts
  - article.interface.ts
  - cart.interface.ts
  - sale.interface.ts
  - message.interface.ts

---

## Fase 3: Autenticación ⭐ PRIORIDAD 1

### 3.1 Página de Login
- [ ] Crear `features/auth/pages/login/login.page.ts`
- [ ] Formulario con Bulma:
  - Campo email (validación)
  - Campo password
  - Botón "Entrar"
  - Link a registro
- [ ] Implementar lógica de login
- [ ] Guardar tokens en storage
- [ ] Navegar a tabs tras login exitoso

### 3.2 Página de Registro
- [ ] Crear `features/auth/pages/register/register.page.ts`
- [ ] Formulario con Bulma:
  - Email, password, nombre, apellidos, teléfono
  - Validaciones (email válido, password mínimo 8 caracteres)
- [ ] Implementar lógica de registro
- [ ] Auto-login tras registro exitoso

### 3.3 Splash/Loading Inicial
- [ ] Verificar token al iniciar app
- [ ] Mostrar splash screen mientras carga
- [ ] Redirigir a login o tabs según autenticación

---

## Fase 4: Grupos de Consumo ⭐ PRIORIDAD 2

### 4.1 ConsumerGroupService
- [ ] Crear `features/group/services/consumer-group.service.ts`
- [ ] Signals:
  - userGroups signal (array de grupos del usuario)
  - currentGroup signal (grupo seleccionado)
  - isOpen computed (si el grupo está abierto ahora)
- [ ] Métodos:
  - loadUserGroups()
  - setCurrentGroup(groupId)
  - getGroupDetail(groupId)
  - getMembers(groupId)
  - leaveGroup(groupId)
  - isGroupOpen(groupId) - Calcular según horario

### 4.2 Página de Perfil del Grupo
- [ ] Crear `features/group/pages/group-profile/group-profile.page.ts`
- [ ] Banner superior:
  - Imagen del grupo a la izquierda
  - Nombre del grupo
  - Indicador si está abierto (verde) o cerrado (rojo)
  - Click en banner → Ir a detalle del grupo
- [ ] Muro de publicaciones (reutilizar componente de mensajes)

### 4.3 Página de Detalle del Grupo
- [ ] Crear `features/group/pages/group-detail/group-detail.page.ts`
- [ ] Banner igual que perfil
  - Si tiene más de 1 grupo → Click muestra modal selector
  - Long press → Modal selector
- [ ] Descripción del grupo
- [ ] Horarios de apertura (formato tabla)
- [ ] Listado de miembros (avatar + nombre)
- [ ] Botón "Deixar el grup" con modal de confirmación

### 4.4 Modal Selector de Grupo
- [ ] Crear `features/group/pages/group-selector-modal/group-selector-modal.component.ts`
- [ ] Listar todos los grupos del usuario
- [ ] Marcar el actual con check
- [ ] Permitir cambiar de grupo
- [ ] Actualizar currentGroup signal

---

## Fase 5: Aparador (Showcase) ⭐ PRIORIDAD 3

### 5.1 ArticleService
- [ ] Crear `features/showcase/services/article.service.ts`
- [ ] Signals:
  - articles signal
  - showcaseArticles computed (filtrar por inShowcase)
  - loading signal
- [ ] Métodos:
  - loadArticles(groupId)
  - getArticleDetail(id)
  - searchArticles(query)

### 5.2 Componente ArticleCard
- [ ] Crear `features/showcase/components/article-card/article-card.component.ts`
- [ ] Mostrar:
  - Imagen del artículo (placeholder si no tiene)
  - Nombre
  - Precio por unidad de medida
  - Productor/Empresa
- [ ] Click → Abrir modal de cantidad

### 5.3 Modal de Cantidad
- [ ] Crear `features/showcase/components/quantity-modal/quantity-modal.component.ts`
- [ ] Mostrar información del artículo
- [ ] Input numérico para cantidad
- [ ] Mostrar unidad de medida correcta (kg, g, l, ml)
- [ ] Calcular precio total en tiempo real
- [ ] Botón "Afegir a la cistella"
- [ ] Añadir al CartService

### 5.4 Página de Aparador
- [ ] Crear `features/showcase/pages/showcase/showcase.page.ts`
- [ ] Mostrar grid de ArticleCards
- [ ] Implementar búsqueda/filtro
- [ ] Pull to refresh
- [ ] Loading skeleton mientras carga
- [ ] Mensaje si no hay artículos

---

## Fase 6: Cistella (Cart) ⭐ PRIORIDAD 3

### 6.1 CartService
- [ ] Crear `features/cart/services/cart.service.ts`
- [ ] Signals:
  - cartItems signal (array de items)
  - totalPrice computed
  - itemCount computed
  - currentGroupId signal
- [ ] Métodos:
  - addItem(article, quantity)
  - removeItem(articleId)
  - updateQuantity(articleId, quantity)
  - clear()
  - checkout(groupId)
  - loadFromStorage()
  - saveToStorage()
- [ ] Persistir carrito en Capacitor Preferences (por grupo)

### 6.2 Componente CartItem
- [ ] Crear `features/cart/components/cart-item/cart-item.component.ts`
- [ ] Mostrar:
  - Imagen del artículo
  - Nombre
  - Cantidad y unidad
  - Precio total
- [ ] Click → Modal para editar cantidad
- [ ] Swipe right → Eliminar con confirmación

### 6.3 Página de Cistella
- [ ] Crear `features/cart/pages/cart/cart.page.ts`
- [ ] Listar CartItems
- [ ] Mostrar total en la parte superior
- [ ] Botón "Tramitar comanda" (fijo arriba)
- [ ] Mensaje si cistella vacía
- [ ] Implementar checkout:
  - Llamar a API POST /sales
  - Mostrar modal de confirmación
  - Limpiar carrito tras éxito
  - Navegar a historial de pedidos

---

## Fase 7: Perfil de Usuario

### 7.1 UserProfileService
- [ ] Crear `features/profile/services/user-profile.service.ts`
- [ ] Signals:
  - userOrders signal
  - userStats signal (total pagado, pendiente, etc.)
- [ ] Métodos:
  - loadOrders()
  - updateProfile(userData)
  - uploadProfileImage(file)

### 7.2 Página de Perfil
- [ ] Crear `features/profile/pages/user-profile/user-profile.page.ts`
- [ ] Mostrar:
  - Avatar del usuario (con opción de cambiar)
  - Nombre y apellidos
  - Email y teléfono
  - Botón "Editar perfil"
- [ ] Secciones:
  - Mis comandes (navegar a historial)
  - Ajustes (navegar a settings)
  - Tancar sessió

### 7.3 Página de Historial de Pedidos
- [ ] Crear `features/profile/pages/orders-history/orders-history.page.ts`
- [ ] Listar pedidos del usuario
- [ ] Mostrar:
  - Fecha de pedido
  - Total
  - Estado de pago (pagado/pendiente/parcial)
  - Si es parcial, mostrar cantidad pendiente
- [ ] Click en pedido → Ver detalle
- [ ] Filtros: Todos, Pagados, Pendientes

### 7.4 Página de Ajustes
- [ ] Crear `features/profile/pages/settings/settings.page.ts`
- [ ] Selector de idioma (Catalán/Castellano)
- [ ] About de la app (versión, info)
- [ ] Botón cerrar sesión
- [ ] Enlaces a políticas/privacidad

### 7.5 Editar Perfil
- [ ] Modal o página para editar:
  - Nombre, apellidos, teléfono
  - Cambiar password (opcional)
- [ ] Validaciones
- [ ] Guardar cambios en API

---

## Fase 8: Muro de Publicaciones (Messages) ⭐ PRIORIDAD 4

### 8.1 MessageService
- [ ] Crear `features/messages/services/message.service.ts`
- [ ] Signals:
  - messages signal
  - loading signal
- [ ] Métodos:
  - loadMessages(groupId, pagination)
  - sendMessage(groupId, text, image?)
  - deleteMessage(messageId)
  - loadMore() - Paginación infinita

### 8.2 Componente MessageItem
- [ ] Crear `features/messages/components/message-item/message-item.component.ts`
- [ ] Mostrar:
  - Avatar del remitente
  - Nombre y apellidos
  - Si es gestor, mostrar badge "Gestor"
  - Contenido del mensaje
  - Imagen (si tiene)
  - Fecha/hora
- [ ] Alinear a la izquierda (otros) o derecha (propios)

### 8.3 Página de Muro
- [ ] Crear `features/messages/pages/messages-wall/messages-wall.page.ts`
- [ ] Lista de mensajes con scroll infinito
- [ ] Input fijo abajo para escribir mensaje
- [ ] Botón para adjuntar imagen (Camera plugin)
- [ ] Enviar mensaje con Enter o botón
- [ ] Auto-scroll al enviar mensaje
- [ ] Pull to refresh

### 8.4 Gestión de Imágenes
- [ ] Integrar Capacitor Camera
- [ ] Permitir elegir desde galería o tomar foto
- [ ] Mostrar preview antes de enviar
- [ ] Comprimir imagen antes de subir

---

## Fase 9: Componentes Compartidos

### 9.1 Loading Skeleton
- [ ] Crear componente de skeleton para:
  - ArticleCard
  - CartItem
  - MessageItem

### 9.2 Empty States
- [ ] Crear componente para estados vacíos:
  - Cistella vacía
  - No hay pedidos
  - No hay mensajes
  - No hay artículos

### 9.3 Confirmación Modal
- [ ] Componente reutilizable de confirmación
- [ ] Uso para:
  - Eliminar item del carrito
  - Dejar grupo
  - Cerrar sesión

### 9.4 Image Viewer
- [ ] Modal para ver imágenes a pantalla completa
- [ ] Pinch to zoom
- [ ] Usar en artículos y mensajes

---

## Fase 10: Tabs y Navegación

### 10.1 Componente Tabs
- [ ] Crear `tabs/tabs.page.ts`
- [ ] Configurar ion-tabs con 4 tabs:
  - Aparador (home icon)
  - Cistella (cart icon + badge con cantidad)
  - Grup (people icon)
  - Perfil (person icon)
- [ ] Configurar routing de tabs

### 10.2 Routing Principal
- [ ] Configurar `app.routes.ts`:
  - /auth (login, register)
  - /tabs (rutas protegidas con guards)
  - Redirect por defecto a /tabs/showcase

---

## Fase 11: Optimizaciones y Polish

### 11.1 Performance
- [ ] Implementar ChangeDetection OnPush en todos los componentes
- [ ] Usar trackBy en *ngFor
- [ ] Lazy loading de imágenes
- [ ] Optimizar imágenes (WebP)
- [ ] Virtual scroll en listas largas

### 11.2 UX Improvements
- [ ] Haptic feedback en acciones importantes (Capacitor Haptics)
- [ ] Toasts informativos (éxito, error)
- [ ] Loading spinners consistentes
- [ ] Animaciones suaves entre páginas
- [ ] Pull to refresh en todas las listas

### 11.3 Offline Support
- [ ] Detectar conexión (Network API)
- [ ] Mostrar mensaje si no hay conexión
- [ ] Cache de imágenes
- [ ] Guardar carrito localmente

### 11.4 Accesibilidad
- [ ] Añadir labels a todos los inputs
- [ ] ARIA attributes en componentes
- [ ] Contraste de colores adecuado
- [ ] Tamaños de fuente escalables

---

## Fase 12: Testing Manual y Ajustes

### 12.1 Testing en Dispositivos
- [ ] Probar en iOS
- [ ] Probar en Android
- [ ] Verificar permisos de cámara
- [ ] Verificar storage local
- [ ] Verificar notificaciones (futuro)

### 12.2 Ajustes Finales
- [ ] Ajustar colores de Bulma
- [ ] Refinar spacing y padding
- [ ] Unificar estilos de botones
- [ ] Revisar todas las traducciones

---

## Orden de Implementación Recomendado

1. **Setup + Core Services** (Fases 1-2) ⭐
2. **Autenticación** (Fase 3) ⭐
3. **Grupos de Consumo** (Fase 4) ⭐
4. **Aparador** (Fase 5) ⭐
5. **Cistella** (Fase 6) ⭐
6. **Tabs y Navegación** (Fase 10) - Conectar todo
7. **Perfil de Usuario** (Fase 7)
8. **Muro de Publicaciones** (Fase 8) ⭐
9. **Componentes Compartidos** (Fase 9)
10. **Optimizaciones** (Fase 11)
11. **Testing** (Fase 12)

---

## Dependencias Entre Features

```
Auth → (todos los demás)
Core Services → (todos los demás)
Groups → Showcase, Cart, Messages
Showcase → Cart
Cart → Showcase, Profile (orders)
Messages → Groups
Profile → Groups (para pedidos)
```

---

## Notas Importantes

- Usar Bulma classes en lugar de Ionic components cuando sea posible
- Mantener signals reactivos para mejor performance
- Persistir carrito por grupo (key: `cart_${groupId}`)
- Implementar refresh token antes que expire (15min)
- Comprimir imágenes antes de subir a S3
- Gestionar loading states en todas las llamadas API
- Mostrar feedback visual inmediato en todas las acciones

