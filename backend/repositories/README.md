# Repository Layer - Data Access Layer

Este diretório contém a camada de acesso a dados (Data Access Layer) do Dashboard Analytics. Os repositórios fornecem uma abstração limpa sobre as operações do Prisma ORM.

## Arquitetura

A camada de repositórios segue o padrão Repository, separando a lógica de acesso a dados da lógica de negócio. Cada repositório é responsável por operações CRUD em um modelo específico do banco de dados.

## Estrutura

```
repositories/
├── BaseRepository.ts          # Classe base para todos os repositórios
├── UserRepository.ts          # Operações CRUD de usuários
├── DashboardRepository.ts     # Operações CRUD e compartilhamento de dashboards
├── WidgetRepository.ts        # Operações CRUD de widgets
├── LayoutRepository.ts        # Operações de salvar/carregar layouts
├── ScheduleRepository.ts      # Operações CRUD de agendamentos
├── index.ts                   # Exportações centralizadas
├── repositories.test.ts       # Testes unitários
└── README.md                  # Esta documentação
```

## Repositórios Disponíveis

### BaseRepository

Classe abstrata base que fornece acesso ao PrismaClient. Todos os repositórios específicos estendem esta classe.

```typescript
import { BaseRepository } from './BaseRepository';

class MyRepository extends BaseRepository {
  // Acesso ao this.prisma disponível
}
```

### UserRepository

Gerencia operações relacionadas a usuários.

**Métodos principais:**
- `create(data)` - Criar novo usuário
- `findById(id)` - Buscar usuário por ID
- `findByEmail(email)` - Buscar usuário por email
- `findAll(options)` - Listar todos os usuários
- `update(id, data)` - Atualizar usuário
- `delete(id)` - Deletar usuário
- `existsByEmail(email)` - Verificar se email existe

**Exemplo:**
```typescript
const userRepo = new UserRepository();
const user = await userRepo.create({
  email: 'user@example.com',
  password: 'hashedPassword',
  name: 'John Doe',
  role: Role.ANALYST
});
```

### DashboardRepository

Gerencia operações relacionadas a dashboards, incluindo compartilhamento.

**Métodos principais:**
- `create(data)` - Criar novo dashboard
- `findById(id, includeRelations)` - Buscar dashboard por ID
- `findByUserId(userId, options)` - Buscar dashboards do usuário
- `findPublic(options)` - Buscar dashboards públicos
- `update(id, data)` - Atualizar dashboard
- `delete(id)` - Deletar dashboard
- `share(data)` - Compartilhar dashboard com usuário
- `unshare(dashboardId, userId)` - Remover compartilhamento
- `hasAccess(dashboardId, userId)` - Verificar acesso
- `getUserPermission(dashboardId, userId)` - Obter nível de permissão

**Exemplo:**
```typescript
const dashboardRepo = new DashboardRepository();
const dashboard = await dashboardRepo.create({
  title: 'Sales Dashboard',
  description: 'Q4 Sales Metrics',
  userId: 'user-id',
  isPublic: false
});

// Compartilhar com outro usuário
await dashboardRepo.share({
  dashboardId: dashboard.id,
  userId: 'other-user-id',
  permission: Permission.VIEW
});
```

### WidgetRepository

Gerencia operações relacionadas a widgets.

**Métodos principais:**
- `create(data)` - Criar novo widget
- `findById(id)` - Buscar widget por ID
- `findByDashboardId(dashboardId)` - Buscar widgets de um dashboard
- `findByType(type, options)` - Buscar widgets por tipo
- `update(id, data)` - Atualizar widget
- `delete(id)` - Deletar widget
- `deleteByDashboardId(dashboardId)` - Deletar todos os widgets de um dashboard
- `createMany(widgets)` - Criar múltiplos widgets
- `countByDashboard(dashboardId)` - Contar widgets em um dashboard

**Exemplo:**
```typescript
const widgetRepo = new WidgetRepository();
const widget = await widgetRepo.create({
  dashboardId: 'dashboard-id',
  type: WidgetType.LINE_CHART,
  title: 'Revenue Trend',
  config: { color: 'blue', showLegend: true },
  dataSource: 'sales-api'
});
```

### LayoutRepository

Gerencia operações relacionadas a layouts personalizados.

**Métodos principais:**
- `save(data)` - Salvar layout (cria ou atualiza)
- `load(userId, dashboardId)` - Carregar layout
- `findById(id)` - Buscar layout por ID
- `findByUserId(userId)` - Buscar layouts do usuário
- `findByDashboardId(dashboardId)` - Buscar layouts de um dashboard
- `update(userId, dashboardId, data)` - Atualizar layout
- `delete(userId, dashboardId)` - Deletar layout
- `updateTheme(userId, dashboardId, theme)` - Atualizar tema
- `getTheme(userId, dashboardId)` - Obter tema

**Exemplo:**
```typescript
const layoutRepo = new LayoutRepository();
const layout = await layoutRepo.save({
  userId: 'user-id',
  dashboardId: 'dashboard-id',
  layout: {
    widgets: [
      { i: 'widget-1', x: 0, y: 0, w: 6, h: 4 },
      { i: 'widget-2', x: 6, y: 0, w: 6, h: 4 }
    ]
  },
  theme: Theme.DARK
});
```

### ScheduleRepository

Gerencia operações relacionadas a agendamentos de relatórios.

**Métodos principais:**
- `create(data)` - Criar novo agendamento
- `findById(id)` - Buscar agendamento por ID
- `findByUserId(userId, options)` - Buscar agendamentos do usuário
- `findActive(options)` - Buscar agendamentos ativos
- `findDue(beforeDate)` - Buscar agendamentos prontos para execução
- `findByDashboardId(dashboardId)` - Buscar agendamentos de um dashboard
- `update(id, data)` - Atualizar agendamento
- `updateLastRun(id, lastRun)` - Atualizar última execução
- `updateNextRun(id, nextRun)` - Atualizar próxima execução
- `activate(id)` - Ativar agendamento
- `deactivate(id)` - Desativar agendamento
- `delete(id)` - Deletar agendamento

**Exemplo:**
```typescript
const scheduleRepo = new ScheduleRepository();
const schedule = await scheduleRepo.create({
  userId: 'user-id',
  name: 'Daily Sales Report',
  cronExpr: '0 9 * * *', // Todos os dias às 9h
  dashboardId: 'dashboard-id',
  format: [ExportFormat.PDF, ExportFormat.CSV],
  recipients: ['manager@example.com', 'team@example.com'],
  nextRun: new Date('2024-01-01T09:00:00')
});

// Buscar agendamentos prontos para execução
const dueSchedules = await scheduleRepo.findDue(new Date());
```

## Uso com Transações

Todos os repositórios suportam transações do Prisma:

```typescript
import { PrismaClient } from '@prisma/client';
import { UserRepository, DashboardRepository } from './repositories';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
  const userRepo = new UserRepository(tx as any);
  const dashboardRepo = new DashboardRepository(tx as any);
  
  const user = await userRepo.create({
    email: 'user@example.com',
    password: 'hashed',
    name: 'User'
  });
  
  const dashboard = await dashboardRepo.create({
    title: 'My Dashboard',
    userId: user.id
  });
});
```

## DTOs (Data Transfer Objects)

Cada repositório define interfaces para criação e atualização:

- `CreateXDto` - Dados necessários para criar um registro
- `UpdateXDto` - Dados opcionais para atualizar um registro

Exemplo:
```typescript
interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: Role;
}
```

## Testes

Os repositórios possuem testes unitários que utilizam mocks do Prisma:

```bash
npm test -- backend/repositories/repositories.test.ts
```

## Boas Práticas

1. **Sempre use repositórios** ao invés de acessar o Prisma diretamente nas camadas superiores
2. **Injete o PrismaClient** quando precisar de transações
3. **Use DTOs** para garantir type safety
4. **Trate erros** nas camadas superiores (services)
5. **Mantenha repositórios simples** - apenas operações de dados, sem lógica de negócio

## Próximos Passos

Após implementar os repositórios, o próximo passo é criar a camada de serviços (Business Logic Layer) que utilizará estes repositórios para implementar as regras de negócio da aplicação.
