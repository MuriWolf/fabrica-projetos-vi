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

### Registration

The `/register` page creates an account with e-mail, CPF and password, then
signs the user in automatically.

- **Mock mode:** registrations are kept in memory for the current app session.
  They are lost on a full reload after logging out.
- **Real API:** uses `POST /api/users` followed by `POST /api/auth/login`.

### Profile in real mode

The backend stores only e-mail, CPF and password. Name and phone remain local to
the browser, so those fields are disabled when `NUXT_PUBLIC_USE_MOCKS=false`.

Saving in real mode requires the account password because
`PUT /api/users/{id}` requires `email`, `password` and `cpf`. The password field
accepts the current password (to keep it) or a new one (to change it).

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run preview    # preview production build
npm run typecheck  # TypeScript checks
```
