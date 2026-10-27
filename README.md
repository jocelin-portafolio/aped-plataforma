# APED · Plataforma web

Plataforma full stack para **APED (Agrupación Personas Empoderadas por la Discapacidad)**, organización comunitaria de Maipú, Chile. Centraliza la oferta de servicios clínicos y talleres grupales, la reserva de horas con terapeutas, la inscripción a talleres con control de cupos y la recepción de donaciones.

![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose_8-880000)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

## Funcionalidades

- **Servicios clínicos:** catálogo de terapia ocupacional, fonoaudiología, terapia conductual y psicología, con reserva de horas.
- **Disponibilidad en tiempo real:** el endpoint de disponibilidad cruza el horario semanal de cada terapeuta con las citas ya agendadas y devuelve solo los bloques libres.
- **Talleres grupales:** inscripción por sesión con **control de capacidad y lista de espera automática** cuando se alcanza el cupo máximo; evita inscripciones duplicadas.
- **Donaciones:** formulario dedicado con validación en cliente y servidor.
- **Galería** con lightbox accesible.
- **Chatbot de atención al cliente:** widget flotante en todas las páginas que responde con Claude (streaming) usando la información de servicios, talleres y contacto de `config/`. Sin `ANTHROPIC_API_KEY` responde gratis con preguntas frecuentes predefinidas (`config/chatbotFaq.js`): entiende mensajes sin tildes o con errores de escritura y ofrece botones de seguimiento.
- **Reserva de horas por chat (web y WhatsApp) y en el formulario de `/servicios-clinicos`:** Terapia Ocupacional, Fonoaudiología y Psicología. El bot guía paso a paso (especialidad → día → hora → datos del paciente → confirmación) consultando la agenda en tiempo real: horario semanal de cada terapeuta menos las citas tomadas, en la zona horaria de Santiago. Al confirmar vuelve a validar el bloque y evita dobles reservas simultáneas.
- **Bot en WhatsApp** (API de WhatsApp Cloud de Meta): el mismo asistente responde y agenda en el WhatsApp de APED, con botones y listas interactivas.
- **Acceso del equipo (`/login`):** inicio de sesión para **administradores** y **terapeutas**, con cookie de sesión firmada (HttpOnly, 8 horas), bloqueo tras 5 intentos fallidos y redirección según el rol.
  - **Administrador (`/admin`):** citas de los próximos 30 días con datos del paciente; confirmar, cancelar o marcar como realizada / no asistió; crear cuentas de administrador o terapeuta (vinculadas a su ficha), desactivarlas y cambiar contraseñas.
  - **Terapeuta (`/terapeuta`):** solo sus citas de los próximos 14 días (confirmar, realizada, no asistió) y su horario semanal.
- **SEO técnico:** metadatos por ruta (Metadata API del App Router) y datos estructurados **JSON-LD (schema.org `NGO`)**.

## Arquitectura

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/                # Route Handlers REST
│   │   ├── appointments/   # CRUD de citas con filtros y paginación
│   │   ├── availability/   # Cálculo de bloques libres por terapeuta y día
│   │   ├── chat/           # Chatbot web (respuestas y reserva de horas)
│   │   ├── clients/
│   │   ├── donations/
│   │   ├── therapists/
│   │   ├── whatsapp/       # Webhook del bot de WhatsApp
│   │   └── workshops/      # Talleres, sesiones e inscripción ([id]/enroll)
│   ├── servicios-clinicos/ · talleres/ · apoyanos/
│   └── layout.js
├── components/
│   ├── ui/                 # Design system: Button, Card, Badge, Alert, Lightbox…
│   ├── layout/             # Header, Footer, JsonLd
│   ├── sections/           # Secciones de la landing
│   └── features/           # booking · donations · gallery · services
├── models/                 # Esquemas Mongoose (Appointment, Client, Therapist, Workshop…)
├── lib/                    # validators, respuestas HTTP normalizadas, JSON-LD
├── hooks/                  # useApi, useFormState, useLightbox
└── config/                 # Conexión a BD, navegación y contenido estático
```

### Decisiones técnicas

| Decisión | Motivo |
|---|---|
| **Route Handlers de Next.js** como capa API | Frontend y backend en un solo despliegue, sin servidor Express aparte. |
| **Conexión a MongoDB cacheada en `global`** | Evita abrir conexiones nuevas en cada invocación en entornos serverless y con hot reload. |
| **Respuestas HTTP normalizadas** (`successResponse`, `errorResponse`, `paginatedResponse`) | Contrato uniforme para todos los consumidores del API. |
| **Validación en capa propia** (`lib/validators.js`) | Reglas reutilizables (formato HH:MM, coherencia inicio < fin, email, teléfono) separadas de los handlers. |
| **Lógica de negocio en los modelos** (`WorkshopSession.addClient`) | La regla de cupo / lista de espera vive junto a los datos que protege. |
| **`populate` + `lean()`** en consultas | Relaciones resueltas en una sola consulta y objetos planos más livianos. |
| **Contraseñas con bcrypt** (factor 12) en hook `pre('save')` | El hash nunca depende de que el handler lo recuerde. |

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/appointments` | Lista citas. Filtros: `therapistId`, `clientId`, `specialty`, `date`, `status`. Paginación: `page`, `limit`. |
| `POST` | `/api/appointments` | Crea una cita validada. |
| `GET` | `/api/availability?therapistId=&date=` | Bloques horarios disponibles. |
| `GET` | `/api/workshops` · `/api/workshops/sessions` | Talleres y sus sesiones. |
| `POST` | `/api/workshops/:id/enroll` | Inscribe a un cliente o lo envía a lista de espera. |
| `POST` | `/api/donations` | Registra una donación. |
| `GET` | `/api/booking/availability?specialty=` | Horas libres en tiempo real de una especialidad agendable en línea (próximos 14 días). |
| `POST` | `/api/booking` | Reserva desde el formulario web: `{ specialty, therapistId, date, startTime, patient }`. Responde 409 si la hora ya se tomó. |
| `POST` | `/api/auth/login` · `/api/auth/logout` | Inicia o cierra la sesión del equipo. |
| `POST` · `PATCH` | `/api/admin/users` | Crea cuentas; activa/desactiva y cambia contraseñas (solo administrador). |
| `POST` | `/api/chat` | Chatbot web: recibe `{ messages, booking?, optionId? }`. Responde texto en streaming, o JSON `{ reply, options, booking }` durante una reserva. |
| `GET` · `POST` | `/api/whatsapp` | Webhook de WhatsApp: verificación (`hub.challenge`) y mensajes entrantes firmados por Meta. |

## Ejecución local

Requisitos: Node.js 18.18+ y una instancia de MongoDB (local o Atlas).

```bash
npm install
cp .env.example .env.local   # configura MONGODB_URI
npm run dev                  # http://localhost:3000
```

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión a MongoDB |
| `NEXT_PUBLIC_BASE_URL` | URL pública, usada en metadatos y JSON-LD |
| `ANTHROPIC_API_KEY` | API key de Claude para el chatbot (opcional; sin ella usa respuestas predefinidas) |
| `ANTHROPIC_MODEL` | Modelo del chatbot (opcional, por defecto `claude-opus-5-5`) |
| `AUTH_SECRET` | Secreto para firmar las sesiones del equipo (mínimo 32 caracteres aleatorios) |
| `WHATSAPP_TOKEN` | Token de acceso permanente de la app de Meta (usuario del sistema) |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp en Meta (no es el número de teléfono) |
| `WHATSAPP_APP_SECRET` | Secreto de la app de Meta, para verificar la firma de los webhooks |
| `WHATSAPP_VERIFY_TOKEN` | Texto que eliges tú y repites en Meta al configurar el webhook |
| `WHATSAPP_API_VERSION` | Versión de la Graph API (opcional, por defecto `v23.0`) |

### Primer administrador

Las cuentas se crean desde `/admin`, así que la primera se crea con un script (usa `MONGODB_URI` de `.env.local`):

```bash
npm run create-admin -- --email ana@apedchile.cl --name "Ana Pérez"
```

Genera una contraseña aleatoria y la muestra una sola vez (o usa `ADMIN_PASSWORD` si está definida). Para generar `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Las rutas con datos privados exigen sesión: citas (`/api/appointments`, el terapeuta solo ve y cambia las suyas), pacientes (`/api/clients`), donaciones (`GET`/`PATCH /api/donations`) y la creación de terapeutas y talleres (solo administrador). El listado público de terapeutas ya no incluye su email ni teléfono.

### Probar la reserva de horas sin MongoDB

```bash
npm run demo:db    # MongoDB temporal con 3 terapeutas de ejemplo en el puerto 27018
```

En otra terminal, arranca el sitio apuntando a esa base (`MONGODB_URI=mongodb://127.0.0.1:27018/aped npm run dev`) y escribe "quiero reservar una hora" en el chat. Los datos se borran al detener `demo:db`. También crea una cuenta de administrador y una de terapeuta de demo, con contraseñas nuevas que muestra en la terminal (necesitas definir `AUTH_SECRET` para entrar).

### Tests

```bash
npm test
```

Los tests de la agenda y de WhatsApp levantan un MongoDB en memoria (`mongodb-memory-server`); la primera vez descargan el binario de MongoDB.

## Publicación en el servidor (Vultr)

El sitio corre con Docker en el servidor, detrás del proxy compartido NINTAI (Caddy, HTTPS automático). Para instalar o actualizar, en el servidor como root:

```bash
bash /root/aped-install.sh main
```

### Dominio propio (www.apedchile.cl)

1. Registra el dominio en [NIC Chile](https://www.nic.cl/).
2. Administra el DNS (por ejemplo, gratis en Cloudflare: agrega el dominio y pon en NIC Chile los dos servidores de nombres que te indique).
3. Crea dos registros **A** hacia la IP del servidor, `apedchile.cl` y `www.apedchile.cl`. En Cloudflare, déjalos en "Solo DNS" (nube gris) para que el servidor emita el certificado HTTPS.
4. Cuando resuelvan, en el servidor:

```bash
bash /root/aped-install.sh main www.apedchile.cl
```

El script comprueba que el dominio apunte al servidor antes de tocar nada. `apedchile.cl` y la dirección sslip.io anterior quedan redirigiendo a `www.apedchile.cl`.

## Conectar el bot a WhatsApp

1. En [Meta for Developers](https://developers.facebook.com/) crea una app de tipo **Empresa** y agrega el producto **WhatsApp**.
2. Agrega y verifica el número de APED en WhatsApp Manager. Revisa en la documentación de Meta si el número puede seguir usándose en la app WhatsApp Business o si pasa a funcionar solo con la API.
3. Crea un **usuario del sistema** con un token permanente con permisos `whatsapp_business_messaging` y `whatsapp_business_management`, y copia el **Phone number ID** y el **App secret**.
4. Publica el sitio con HTTPS y configura el webhook en Meta: URL `https://<tu-dominio>/api/whatsapp`, el mismo `WHATSAPP_VERIFY_TOKEN`, y suscríbete al campo `messages`.
5. Define las variables `WHATSAPP_*` en el servidor y escribe al número para probar.

El bot responde mensajes que inician las personas (dentro de la ventana de 24 horas de WhatsApp); no envía mensajes por iniciativa propia.

## Próximos pasos

- Recuperación de contraseña por correo (hoy la restablece un administrador).
- Editar el horario semanal de los terapeutas desde el panel.
- Notificaciones por correo al confirmar citas o pasar de lista de espera a inscrito.
- Tests de integración de los Route Handlers restantes.
- Recordatorios de citas por WhatsApp (requieren plantillas aprobadas por Meta).
