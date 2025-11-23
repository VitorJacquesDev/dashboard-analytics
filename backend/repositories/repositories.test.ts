import { PrismaClient, Role, WidgetType, Theme, Permission, ExportFormat } from '@prisma/client';
import {
  UserRepository,
  DashboardRepository,
  WidgetRepository,
  LayoutRepository,
  ScheduleRepository,
} from './index';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    dashboard: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    widget: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    layout: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    schedule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    dashboardShare: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Role: { ADMIN: 'ADMIN', ANALYST: 'ANALYST', VIEWER: 'VIEWER' },
    WidgetType: {
      LINE_CHART: 'LINE_CHART',
      BAR_CHART: 'BAR_CHART',
      PIE_CHART: 'PIE_CHART',
      AREA_CHART: 'AREA_CHART',
      HEATMAP: 'HEATMAP',
      SCATTER_CHART: 'SCATTER_CHART',
      TABLE: 'TABLE',
      METRIC: 'METRIC',
    },
    Theme: { LIGHT: 'LIGHT', DARK: 'DARK' },
    Permission: { VIEW: 'VIEW', EDIT: 'EDIT', ADMIN: 'ADMIN' },
    ExportFormat: { PDF: 'PDF', CSV: 'CSV', XLSX: 'XLSX' },
  };
});

describe('Repository Layer Tests', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('UserRepository', () => {
    let userRepository: UserRepository;

    beforeEach(() => {
      userRepository = new UserRepository(prisma);
    });

    it('should create a user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        role: Role.VIEWER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.create({
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed',
          name: 'Test User',
          role: Role.VIEWER,
        },
      });
    });

    it('should find user by email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        role: Role.VIEWER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('DashboardRepository', () => {
    let dashboardRepository: DashboardRepository;

    beforeEach(() => {
      dashboardRepository = new DashboardRepository(prisma);
    });

    it('should create a dashboard', async () => {
      const mockDashboard = {
        id: '1',
        title: 'Test Dashboard',
        description: 'Test Description',
        userId: 'user1',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
        widgets: [],
      };

      (prisma.dashboard.create as jest.Mock).mockResolvedValue(mockDashboard);

      const result = await dashboardRepository.create({
        title: 'Test Dashboard',
        description: 'Test Description',
        userId: 'user1',
      });

      expect(result).toEqual(mockDashboard);
    });

    it('should share a dashboard', async () => {
      (prisma.dashboardShare.upsert as jest.Mock).mockResolvedValue({});

      await dashboardRepository.share({
        dashboardId: 'dash1',
        userId: 'user2',
        permission: Permission.VIEW,
      });

      expect(prisma.dashboardShare.upsert).toHaveBeenCalled();
    });
  });

  describe('WidgetRepository', () => {
    let widgetRepository: WidgetRepository;

    beforeEach(() => {
      widgetRepository = new WidgetRepository(prisma);
    });

    it('should create a widget', async () => {
      const mockWidget = {
        id: '1',
        dashboardId: 'dash1',
        type: WidgetType.LINE_CHART,
        title: 'Test Widget',
        config: {},
        dataSource: 'test-source',
        createdAt: new Date(),
        updatedAt: new Date(),
        dashboard: {} as any,
      };

      (prisma.widget.create as jest.Mock).mockResolvedValue(mockWidget);

      const result = await widgetRepository.create({
        dashboardId: 'dash1',
        type: WidgetType.LINE_CHART,
        title: 'Test Widget',
        config: {},
        dataSource: 'test-source',
      });

      expect(result).toEqual(mockWidget);
    });

    it('should find widgets by dashboard', async () => {
      const mockWidgets = [
        {
          id: '1',
          dashboardId: 'dash1',
          type: WidgetType.LINE_CHART,
          title: 'Widget 1',
          config: {},
          dataSource: 'source1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.widget.findMany as jest.Mock).mockResolvedValue(mockWidgets);

      const result = await widgetRepository.findByDashboardId('dash1');

      expect(result).toEqual(mockWidgets);
    });
  });

  describe('LayoutRepository', () => {
    let layoutRepository: LayoutRepository;

    beforeEach(() => {
      layoutRepository = new LayoutRepository(prisma);
    });

    it('should save a layout', async () => {
      const mockLayout = {
        id: '1',
        userId: 'user1',
        dashboardId: 'dash1',
        layout: { widgets: [] },
        theme: Theme.LIGHT,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
        dashboard: {} as any,
      };

      (prisma.layout.upsert as jest.Mock).mockResolvedValue(mockLayout);

      const result = await layoutRepository.save({
        userId: 'user1',
        dashboardId: 'dash1',
        layout: { widgets: [] },
      });

      expect(result).toEqual(mockLayout);
    });

    it('should load a layout', async () => {
      const mockLayout = {
        id: '1',
        userId: 'user1',
        dashboardId: 'dash1',
        layout: { widgets: [] },
        theme: Theme.LIGHT,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
        dashboard: {} as any,
      };

      (prisma.layout.findUnique as jest.Mock).mockResolvedValue(mockLayout);

      const result = await layoutRepository.load('user1', 'dash1');

      expect(result).toEqual(mockLayout);
    });
  });

  describe('ScheduleRepository', () => {
    let scheduleRepository: ScheduleRepository;

    beforeEach(() => {
      scheduleRepository = new ScheduleRepository(prisma);
    });

    it('should create a schedule', async () => {
      const mockSchedule = {
        id: '1',
        userId: 'user1',
        name: 'Daily Report',
        cronExpr: '0 9 * * *',
        dashboardId: 'dash1',
        format: [ExportFormat.PDF],
        recipients: ['test@example.com'],
        isActive: true,
        lastRun: null,
        nextRun: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      };

      (prisma.schedule.create as jest.Mock).mockResolvedValue(mockSchedule);

      const result = await scheduleRepository.create({
        userId: 'user1',
        name: 'Daily Report',
        cronExpr: '0 9 * * *',
        dashboardId: 'dash1',
        format: [ExportFormat.PDF],
        recipients: ['test@example.com'],
        nextRun: new Date(),
      });

      expect(result).toEqual(mockSchedule);
    });

    it('should find due schedules', async () => {
      const mockSchedules = [
        {
          id: '1',
          userId: 'user1',
          name: 'Daily Report',
          cronExpr: '0 9 * * *',
          dashboardId: 'dash1',
          format: [ExportFormat.PDF],
          recipients: ['test@example.com'],
          isActive: true,
          lastRun: null,
          nextRun: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {} as any,
        },
      ];

      (prisma.schedule.findMany as jest.Mock).mockResolvedValue(mockSchedules);

      const result = await scheduleRepository.findDue(new Date());

      expect(result).toEqual(mockSchedules);
    });
  });
});
