# Fábrica de Projetos Ágeis VI — Frontend

Aplicação Nuxt 4 + Nuxt UI para gerenciamento de estoque de medicamentos.

## Instalação

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação roda em `http://localhost:3000`.

## Configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | `http://localhost:5080` | URL base do backend ASP.NET |
| `NUXT_PUBLIC_USE_MOCKS` | `true` | Usa os mocks JSON locais em vez da API |

Enquanto o backend não estiver pronto, mantenha `NUXT_PUBLIC_USE_MOCKS=true`.
Quando ele estiver disponível, defina como `false` e inicie o backend na porta
`5080`.

### Usuários de teste

| E-mail | Senha | CPF | Perfil |
|---|---|---|---|
| `aluno@ages.edu.br` | `123456` | `529.982.247-25` | Regular |
| `professor@ages.edu.br` | `abcd1234` | `111.444.777-35` | Regular |
| `admin@example.com` | `admin` | `123.456.789-09` | Admin |

Os dados mock armazenam o CPF apenas com dígitos. A interface o formata como
`000.000.000-00` e valida os dois dígitos verificadores antes de salvar.

### Cadastro

A página `/register` cria uma conta com e-mail, CPF e senha e autentica o
usuário automaticamente.

- **Modo mock:** os cadastros ficam em memória durante a sessão atual da
  aplicação. Eles são perdidos após recarregar a página por completo depois de
  sair.
- **API real:** usa `POST /api/users` seguido de `POST /api/auth/login`.

### Perfil no modo real

O backend armazena apenas e-mail, CPF e senha. Nome e telefone permanecem locais
no navegador, portanto esses campos ficam desabilitados quando
`NUXT_PUBLIC_USE_MOCKS=false`.

Salvar no modo real exige a senha da conta porque `PUT /api/users/{id}` requer
`email`, `password` e `cpf`. O campo de senha aceita a senha atual (para mantê-la)
ou uma nova (para alterá-la).

## Scripts

```bash
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção
npm run preview    # pré-visualização do build de produção
npm run typecheck  # verificação de tipos TypeScript
```
