# Fábrica de Projetos Ágeis VI — Frontend

Aplicação Nuxt 4 + Nuxt UI para gerenciamento de estoque de medicamentos.

## Instalação

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação roda em `http://localhost:3000`.

## Docker

O `Dockerfile` usa build multi-stage com `node:24-alpine`: o estágio de build
executa `npm ci` e `npm run build`, e a imagem final contém `.output` e `.env`,
rodando com o usuário `node` na porta `3000`.

O `.env` é copiado para a imagem e carregado no start pelo Node
(`--env-file=.env`). Se o arquivo não existir, o build cria um `.env` vazio e
os valores padrão do `nuxt.config.ts` são usados. Como o arquivo fica
armazenado na imagem, evite incluir segredos nele.

```bash
cp .env.example .env   # opcional: define os valores embutidos
docker build -t fabrica-projetos-vi .
docker run --rm -p 3000:3000 fabrica-projetos-vi
```

A aplicação fica disponível em `http://localhost:3000`.

Como o `.env` faz parte da imagem, alterações no arquivo exigem um novo build.
Ainda assim, variáveis passadas em tempo de execução têm precedência e podem
sobrescrever os valores embutidos sem rebuild:

```bash
docker run --rm -p 3000:3000 \
  -e NUXT_PUBLIC_API_BASE_URL=http://localhost:5080 \
  -e NUXT_PUBLIC_USE_MOCKS=false \
  fabrica-projetos-vi
```

Também é possível usar `--env-file` com outro arquivo de variáveis:

```bash
docker run --rm -p 3000:3000 --env-file .env fabrica-projetos-vi
```

Para apontar para um backend em execução na máquina host, lembre-se de que
`localhost` dentro do container é o próprio container. Use
`host.docker.internal` (no Linux, adicione
`--add-host=host.docker.internal:host-gateway`) ou o nome do serviço em uma rede
Docker:

```bash
docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e NUXT_PUBLIC_API_BASE_URL=http://host.docker.internal:5080 \
  -e NUXT_PUBLIC_USE_MOCKS=false \
  fabrica-projetos-vi
```

### Stack completa com o backend

Para subir front-end, API e PostgreSQL juntos, use o compose do repositório
backend. Ele clona este repositório público durante o build, então não é
necessário ter o front-end clonado localmente.

No repositório backend:

```bash
cp .env.example .env        # preencha as senhas/chaves
docker compose --profile frontend up --build
```

Sem o profile `frontend`, o compose sobe apenas banco e API:

```bash
docker compose up --build
```

Acesse `http://localhost:3000`. O compose define `NUXT_PUBLIC_USE_MOCKS=false`
e `NUXT_PUBLIC_API_BASE_URL=http://localhost:5080` em runtime, sobrescrevendo o
`.env` embutido na imagem. Se a porta `3000` estiver ocupada, use
`FRONTEND_PORT=3001` no comando do compose.

Para builds reproduzíveis, fixe uma tag ou commit em `FRONTEND_CONTEXT` no
`.env` do backend:

```dotenv
FRONTEND_CONTEXT=https://github.com/MuriWolf/fabrica-projetos-vi.git#v1.0.0
```

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

O backend armazena apenas e-mail, CPF e senha. Nome e telefone não fazem parte do
modelo de usuário do frontend. O papel (`role`) permanece local no navegador,
pois a API ainda não possui esse campo.

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
