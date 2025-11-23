# Dashboard Analytics

Uma plataforma completa de business intelligence que transforma dados empresariais complexos em insights visuais acionáveis.

## 🚀 Funcionalidades

- **Visualizações Interativas**: Gráficos D3.js (linha, barras, pizza, área, heatmap, scatter)
- **Tempo Real**: Atualizações via WebSockets com Socket.io
- **Layout Personalizável**: Drag-and-drop com react-grid-layout
- **Exportação**: PDF, CSV, XLSX, PNG
- **RBAC**: Controle de acesso baseado em papéis (Admin, Analista, Viewer)
- **Design Responsivo**: Mobile, tablet e desktop
- **Relatórios Agendados**: Sistema CRON com envio por e-mail
- **Filtros Dinâmicos**: Filtros em tempo real com múltiplas condições

## 🛠️ Stack Tecnológica

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4
- D3.js 7
- Socket.io-client
- Zustand (state management)
- react-grid-layout

### Backend

- Next.js API Routes
- Socket.io
- PostgreSQL 15+
- Prisma ORM
- node-cron
- nodemailer
- JWT authentication

### Testing

- Jest + React Testing Library
- fast-check (Property-Based Testing)
- Playwright (E2E)
- Supertest (API testing)

## 📦 Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd dashboard-analytics
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

4. Configure o banco de dados:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e

# Testes E2E com UI
npm run test:e2e:ui
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas do linter
- `npm run format` - Formata o código com Prettier
- `npm run format:check` - Verifica formatação
- `npm run test` - Executa testes unitários
- `npm run test:watch` - Testes em modo watch
- `npm run test:coverage` - Testes com coverage
- `npm run test:e2e` - Testes end-to-end
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa migrations
- `npm run prisma:studio` - Abre o Prisma Studio
- `npm run prisma:seed` - Popula o banco com dados iniciais

## 🏗️ Estrutura do Projeto

```
dashboard-analytics/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   ├── components/           # Componentes React
│   │   ├── charts/          # Componentes de gráficos D3.js
│   │   ├── widgets/         # Widgets do dashboard
│   │   └── layout/          # Componentes de layout
│   ├── dashboard/           # Páginas do dashboard
│   └── globals.css          # Estilos globais
├── backend/                  # Lógica do servidor
│   ├── services/            # Lógica de negócio
│   ├── controllers/         # Controllers da API
│   ├── repositories/        # Acesso a dados
│   ├── workers/             # Background jobs
│   └── middleware/          # Middlewares
├── lib/                      # Utilitários
│   ├── types/               # Tipos TypeScript
│   └── utils/               # Funções auxiliares
├── store/                    # State management (Zustand)
├── prisma/                   # Prisma ORM
│   ├── schema.prisma        # Schema do banco
│   └── migrations/          # Migrations
├── e2e/                      # Testes E2E (Playwright)
└── public/                   # Arquivos estáticos
```

## 🔐 Variáveis de Ambiente

Veja `.env.example` para todas as variáveis necessárias.

Principais variáveis:

- `DATABASE_URL` - URL de conexão do PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT
- `SMTP_*` - Configurações de e-mail
- `NEXT_PUBLIC_API_URL` - URL da API
- `NEXT_PUBLIC_WS_URL` - URL do WebSocket

## 📚 Documentação

Para mais informações, consulte:

- [Documentação de Requisitos](.kiro/specs/dashboard-analytics/requirements.md)
- [Documentação de Design](.kiro/specs/dashboard-analytics/design.md)
- [Plano de Implementação](.kiro/specs/dashboard-analytics/tasks.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

Dashboard Analytics Team
