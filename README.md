# Do It Fitness Club — Backend

API REST en Node.js para gestión de membresías con MercadoPago, Supabase y Google Sheets.

## Stack
- **Node.js + Express** — servidor
- **MercadoPago Checkout Pro** — pasarela de pago
- **Supabase (PostgreSQL)** — almacenamiento temporal de pagos pendientes
- **Google Sheets API** — registro definitivo de miembros
- **Nodemailer** — emails de confirmación

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/health` | Health check del servidor |
| POST   | `/api/payment/create` | Crea preferencia MP y guarda en Supabase |
| POST   | `/api/webhook/mercadopago` | Webhook de confirmación de MP |
| GET    | `/api/membership/check?email=` | Verifica si el email ya existe en Sheets |

## Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run dev
```

## Supabase
Ejecuta `SUPABASE_SETUP.sql` en el SQL Editor de tu proyecto Supabase.

## Google Sheets
1. Crea un Service Account en Google Cloud Console
2. Habilita la Google Sheets API
3. Descarga el JSON de credenciales
4. Comparte tu hoja con el `client_email` del service account
5. Copia `client_email` y `private_key` al `.env`

## Columnas esperadas en el Sheet (A→H)
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Nombre | Email | Celular | F/Nacimiento | Membresía | Valor | Nuevo | Renovación |

## Despliegue en Easypanel
1. Conecta tu repositorio GitHub en Easypanel
2. Configura las variables de entorno del `.env.example`
3. Puerto: `3000`
4. Build command: `npm install`
5. Start command: `npm start`
