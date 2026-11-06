# Fábrica de Projetos Ágeis VI — Frontend

Nuxt 4 + Nuxt UI application for managing medicine stock.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:3000`.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | `http://localhost:5080` | Base URL of the ASP.NET backend |
| `NUXT_PUBLIC_USE_MOCKS` | `true` | Use the local JSON mocks instead of the API |

While the backend is not ready, keep `NUXT_PUBLIC_USE_MOCKS=true`. When it is
available, set it to `false` and start the backend on port `5080`.

### Mock users

| E-mail | Password | CPF | Role |
|---|---|---|---|
| `aluno@ages.edu.br` | `123456` | `529.982.247-25` | Regular |
| `professor@ages.edu.br` | `abcd1234` | `111.444.777-35` | Regular |
| `admin@example.com` | `admin` | `123.456.789-09` | Admin |

Mock data stores CPF as digits only. The UI formats it as `000.000.000-00`
and validates both check digits before saving.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run preview    # preview production build
npm run typecheck  # TypeScript checks
```
