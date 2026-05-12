# CPIM – Sistema de Gestión de Asambleas Ordinarias

Sistema web para gestionar las asambleas ordinarias del **Consejo Profesional de Ingeniería de Misiones**, incluyendo cálculo automático de fechas legales, checklists de documentación, almacenamiento de archivos y alertas por email.

---

## Requisitos

- **Node.js** 18 o superior
- **PostgreSQL** 14 o superior (local o en Railway)
- Cuenta de email SMTP para alertas (Gmail con contraseña de aplicación, o similar)

---

## Instalación local (desarrollo)

### 1. Clonar e instalar dependencias

```bash
cd AsambleasCpim
npm install
```

### 2. Crear el archivo de variables de entorno

```bash
copy .env.example .env
```

Editá `.env` con tus datos:

```env
DATABASE_URL="postgresql://postgres:tu_clave@localhost:5432/cpim_asamblea"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicacion-google"
EMAIL_FROM="CPIM Asambleas <tu-email@gmail.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Gmail**: Activá "Contraseñas de aplicación" en tu cuenta Google (Seguridad → Verificación en 2 pasos → Contraseñas de aplicación).

### 3. Crear la base de datos y aplicar el esquema

```bash
# Crear la base de datos en PostgreSQL primero, luego:
npm run db:push
```

### 4. Cargar la asamblea 2026 con sus fechas (seed)

```bash
npm run db:seed
```

Esto crea automáticamente la Asamblea 2026 con todas las fechas legales calculadas para el **29 de julio de 2026**.

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Despliegue en Railway

### 1. Crear proyecto en Railway

1. Ir a [railway.app](https://railway.app) y crear una cuenta
2. Crear un **New Project** → **Empty project**
3. Agregar un servicio **PostgreSQL** al proyecto
4. Agregar un servicio **GitHub repo** (o subí el código manualmente)

### 2. Variables de entorno en Railway

En el servicio web, agregar estas variables en **Settings → Variables**:

```
DATABASE_URL        → (copiá del servicio PostgreSQL de Railway)
SMTP_HOST           → smtp.gmail.com
SMTP_PORT           → 587
SMTP_SECURE         → false
SMTP_USER           → tu-email@gmail.com
SMTP_PASS           → tu-contraseña-app-google
EMAIL_FROM          → CPIM Asambleas <tu-email@gmail.com>
NEXT_PUBLIC_APP_URL → https://tu-app.railway.app
UPLOAD_DIR          → /app/uploads
```

### 3. Volumen para archivos PDF (importante)

Los PDFs se guardan en disco. Para que persistan en Railway:

1. En Railway → tu servicio → **Volumes** → Add Volume
2. Mount path: `/app/uploads`

Sin el volumen, los archivos se perderán al reiniciar el servicio.

### 4. Comando de build en Railway

Railway lo detecta automáticamente, pero si necesitás configurarlo:
- Build command: `npm run build`
- Start command: `npm run start`

---

## Funcionalidades

### Calendario de Fechas Legales

El sistema calcula automáticamente estas fechas a partir de la fecha de asamblea:

| Paso | Norma | Cálculo |
|------|-------|---------|
| Cierre de ejercicio | Art. 32 Ley I-N°11 | 30 de abril (fijo) |
| Padrón de matriculados | Art. 36 Ley I-N°11 | 45 días corridos antes |
| Fin observaciones al padrón | Art. 37 Ley I-N°11 | +15 días desde padrón |
| Convocatoria en CD (martes) | Art. 35 Ley I-N°11 | Último martes ≥ 20 días antes |
| Presentación Personería (ANTES) | Disp. 25 Art. 6 | 15 días **hábiles** antes |
| Publicación edictos – 1° día | Disp. 25 Art. 7 | 16 días corridos antes |
| Publicación edictos – 2° día | Disp. 25 Art. 7 | 15 días corridos antes (la última pub. ≥ 15d antes) |
| Presentación de listas | Art. 41 Ley I-N°11 | 10 días corridos antes |
| Junta Electoral | Ley I-N°11 | Al día siguiente del cierre de listas |
| **Asamblea Ordinaria** | Art. 32 Ley I-N°11 | Fecha definida por el usuario |
| Presentación Personería (DESPUÉS) | Disp. 25 Art. 6 | 15 días **hábiles** después |

> Los días **hábiles** excluyen sábados, domingos y feriados nacionales argentinos.  
> Los feriados se obtienen automáticamente de [argentinadatos.com](https://api.argentinadatos.com).

### Checklist Pre-Asamblea (Personería Jurídica)

1. Nota de presentación
2. Acta de CD (convocatoria aprobada)
3. Nómina de matriculados (completa + con derecho a voto)
4. Estados Contables + Memoria + Informe de Fiscalización
5. Certificado de Entidad al Día
6. Comprobante de pago de tasas

### Checklist Post-Asamblea (Personería Jurídica)

1. Nota de presentación
2. Acta de Asamblea (libro rubricado)
3. Planilla de asistencia (nombre + DNI + firma)
4. Nómina de nuevas autoridades
5. DDJJ Personas Políticamente Expuestas
6. Ficha de datos filiatorios (autoridades renovadas)
7. Estados Contables (si corresponde)
8. Edictos publicados
9. Comprobante de tasas

---

## Estructura del proyecto

```
cpim-asamblea/
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── asamblea/
│   │   ├── nueva/page.tsx          # Crear nueva asamblea
│   │   └── [id]/
│   │       ├── page.tsx            # Calendario/Timeline
│   │       ├── checklist/page.tsx  # Checklist de documentos
│   │       └── documentos/page.tsx # Repositorio de archivos
│   └── api/                        # API REST (backend)
├── lib/
│   ├── fechas.ts                   # Cálculo de fechas legales
│   ├── feriados.ts                 # Feriados nacionales 2025-2026
│   ├── constants.ts                # Definición de checklist
│   └── email.ts                    # Servicio de alertas
└── prisma/
    └── schema.prisma               # Modelo de base de datos
```

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run db:push      # Sincronizar esquema con la BD
npm run db:seed      # Cargar asamblea 2026
npm run db:studio    # Abrir Prisma Studio (visualizador de BD)
```
