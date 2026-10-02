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
- **SEO técnico:** metadatos por ruta (Metadata API del App Router) y datos estructurados **JSON-LD (schema.org `NGO`)**.

## Arquitectura

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/                # Route Handlers REST
│   │   ├── appointments/   # CRUD de citas con filtros y paginación
│   │   ├── availability/   # Cálculo de bloques libres por terapeuta y día
│   │   ├── clients/
│   │   ├── donations/
│   │   ├── therapists/
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

## Próximos pasos

- Autenticación y panel administrativo para terapeutas.
- Notificaciones por correo al confirmar citas o pasar de lista de espera a inscrito.
- Tests de integración de los Route Handlers.
