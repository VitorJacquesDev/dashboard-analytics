import { PrismaClient, Role, WidgetType, Theme, ExportFormat } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomPick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomDateWithinLastDays(days: number): Date {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  const timestamp = randomInt(start.getTime(), now.getTime());
  return new Date(timestamp);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.operationsTicket.deleteMany();
    await prisma.marketingLead.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.dashboardShare.deleteMany();
    await prisma.layout.deleteMany();
    await prisma.widget.deleteMany();
    await prisma.dashboard.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create users with different roles
  console.log('👤 Creating users...');

  const adminPassword = await bcrypt.hash('admin1307', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dashboard.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  const analystPassword = await bcrypt.hash('analyst1307', 10);
  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@dashboard.com',
      password: analystPassword,
      name: 'Analyst User',
      role: Role.ANALYST,
    },
  });
  console.log(`✅ Created analyst user: ${analyst.email}`);

  const viewerPassword = await bcrypt.hash('viewer1307', 10);
  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@dashboard.com',
      password: viewerPassword,
      name: 'Viewer User',
      role: Role.VIEWER,
    },
  });
  console.log(`✅ Created viewer user: ${viewer.email}`);

  // Create example dashboards
  console.log('📊 Creating dashboards...');

  const salesDashboard = await prisma.dashboard.create({
    data: {
      title: 'Sales Performance Dashboard',
      description: 'Track sales metrics, revenue trends, and team performance',
      userId: analyst.id,
      isPublic: false,
    },
  });
  console.log(`✅ Created dashboard: ${salesDashboard.title}`);

  const marketingDashboard = await prisma.dashboard.create({
    data: {
      title: 'Marketing Analytics',
      description: 'Monitor campaign performance, conversion rates, and ROI',
      userId: analyst.id,
      isPublic: true,
    },
  });
  console.log(`✅ Created dashboard: ${marketingDashboard.title}`);

  const operationsDashboard = await prisma.dashboard.create({
    data: {
      title: 'Operations Overview',
      description: 'Real-time operational metrics and KPIs',
      userId: admin.id,
      isPublic: false,
    },
  });
  console.log(`✅ Created dashboard: ${operationsDashboard.title}`);

  // Create business-domain records used by real Prisma widget sources
  console.log('💼 Creating business-domain records...');

  const salesRegions = ['LATAM', 'North America', 'EMEA', 'APAC'] as const;
  const salesChannels = ['Direct', 'Partner', 'Online', 'Inside Sales'] as const;

  const salesOrders = Array.from({ length: 160 }, (_, index) => {
    const orderDate = randomDateWithinLastDays(60);
    const statusRoll = Math.random();
    const status =
      statusRoll < 0.62
        ? 'PAID'
        : statusRoll < 0.8
          ? 'PROCESSING'
          : statusRoll < 0.92
            ? 'PENDING'
            : 'CANCELLED';

    const amountBase = status === 'CANCELLED' ? randomFloat(50, 600) : randomFloat(200, 6500);

    return {
      dashboardId: salesDashboard.id,
      orderNumber: `SO-${String(index + 1).padStart(5, '0')}`,
      customerName: `Customer ${index + 1}`,
      region: randomPick(salesRegions),
      channel: randomPick(salesChannels),
      status,
      orderDate,
      totalAmount: amountBase,
      createdAt: orderDate,
      updatedAt: orderDate,
    };
  });

  await prisma.salesOrder.createMany({ data: salesOrders });
  console.log(`✅ Created ${salesOrders.length} sales orders`);

  const marketingChannels = ['Organic', 'Paid Search', 'Social', 'Email', 'Referral'] as const;
  const marketingCampaigns = ['Brand Awareness', 'Spring Launch', 'Retention Push', 'ABM Enterprise'] as const;
  const marketingStages = ['Captured', 'Qualified', 'Proposal', 'Won', 'Lost'] as const;

  const marketingLeads = Array.from({ length: 220 }, (_, index) => {
    const capturedAt = randomDateWithinLastDays(60);
    const stage = randomPick(marketingStages);
    const isConverted = stage === 'Won' ? true : stage === 'Lost' ? false : Math.random() < 0.18;
    const convertedAt = isConverted
      ? new Date(capturedAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000)
      : null;

    return {
      dashboardId: marketingDashboard.id,
      leadName: `Lead ${index + 1}`,
      channel: randomPick(marketingChannels),
      campaign: randomPick(marketingCampaigns),
      stage,
      isConverted,
      estimatedValue: randomFloat(500, 25000),
      acquisitionCost: randomFloat(20, 1200),
      capturedAt,
      convertedAt,
      createdAt: capturedAt,
      updatedAt: convertedAt ?? capturedAt,
    };
  });

  await prisma.marketingLead.createMany({ data: marketingLeads });
  console.log(`✅ Created ${marketingLeads.length} marketing leads`);

  const opsTeams = ['Platform', 'Infra', 'Fulfillment', 'Support'] as const;
  const opsPriorities = ['P1', 'P2', 'P3', 'P4'] as const;

  const operationsTickets = Array.from({ length: 140 }, (_, index) => {
    const openedAt = randomDateWithinLastDays(45);
    const priority = randomPick(opsPriorities);
    const statusRoll = Math.random();
    const status =
      statusRoll < 0.22
        ? 'OPEN'
        : statusRoll < 0.48
          ? 'IN_PROGRESS'
          : statusRoll < 0.56
            ? 'BLOCKED'
            : statusRoll < 0.88
              ? 'RESOLVED'
              : 'CLOSED';

    const isResolved = status === 'RESOLVED' || status === 'CLOSED';
    const resolutionMinutes = isResolved ? randomInt(30, 7 * 24 * 60) : null;
    const resolvedAt = isResolved
      ? new Date(openedAt.getTime() + (resolutionMinutes ?? 0) * 60 * 1000)
      : null;

    const slaThresholdMinutes =
      priority === 'P1' ? 4 * 60 : priority === 'P2' ? 8 * 60 : priority === 'P3' ? 24 * 60 : 48 * 60;
    const slaBreached = isResolved ? (resolutionMinutes ?? 0) > slaThresholdMinutes : Math.random() < 0.08;

    return {
      dashboardId: operationsDashboard.id,
      title: `Incident ${index + 1}`,
      team: randomPick(opsTeams),
      priority,
      status,
      openedAt,
      resolvedAt,
      resolutionMinutes,
      slaBreached,
      createdAt: openedAt,
      updatedAt: resolvedAt ?? openedAt,
    };
  });

  await prisma.operationsTicket.createMany({ data: operationsTickets });
  console.log(`✅ Created ${operationsTickets.length} operations tickets`);

  // Create widgets for Sales Dashboard
  console.log('📈 Creating widgets...');

  const revenueWidget = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.LINE_CHART,
      title: 'Receita por Dia',
      dataSource: 'prisma:business.sales.revenue.timeline',
      config: {
        days: 30,
        color: '#3b82f6',
        showGrid: true,
      },
    },
  });

  const salesByRegionWidget = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.BAR_CHART,
      title: 'Pedidos por Região',
      dataSource: 'prisma:business.sales.orders.by_region',
      config: {
        color: '#10b981',
        orientation: 'vertical',
      },
    },
  });

  const productMixWidget = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.PIE_CHART,
      title: 'Pedidos por Canal',
      dataSource: 'prisma:business.sales.orders.by_channel',
      config: {
        showLegend: true,
      },
    },
  });

  const totalRevenueMetric = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.METRIC,
      title: 'Receita Total',
      dataSource: 'prisma:business.sales.revenue.total',
      config: {
        format: 'currency',
        prefix: '$',
      },
    },
  });

  console.log(`✅ Created ${4} widgets for Sales Dashboard`);

  // Create widgets for Marketing Dashboard
  const conversionWidget = await prisma.widget.create({
    data: {
      dashboardId: marketingDashboard.id,
      type: WidgetType.AREA_CHART,
      title: 'Leads por Dia',
      dataSource: 'prisma:business.marketing.leads.timeline',
      config: {
        days: 30,
        colors: ['#8b5cf6', '#ec4899', '#f59e0b'],
      },
    },
  });

  const campaignPerformanceWidget = await prisma.widget.create({
    data: {
      dashboardId: marketingDashboard.id,
      type: WidgetType.BAR_CHART,
      title: 'Leads por Canal',
      dataSource: 'prisma:business.marketing.leads.by_channel',
      config: {
        color: '#f59e0b',
      },
    },
  });

  const heatmapWidget = await prisma.widget.create({
    data: {
      dashboardId: marketingDashboard.id,
      type: WidgetType.TABLE,
      title: 'Funil por Etapa',
      dataSource: 'prisma:business.marketing.leads.by_stage',
      config: {
        sortable: true,
      },
    },
  });

  console.log(`✅ Created ${3} widgets for Marketing Dashboard`);

  // Create widgets for Operations Dashboard
  const kpiTableWidget = await prisma.widget.create({
    data: {
      dashboardId: operationsDashboard.id,
      type: WidgetType.TABLE,
      title: 'Tickets por Prioridade',
      dataSource: 'prisma:business.operations.tickets.by_priority',
      config: {
        sortable: true,
      },
    },
  });

  const uptimeWidget = await prisma.widget.create({
    data: {
      dashboardId: operationsDashboard.id,
      type: WidgetType.LINE_CHART,
      title: 'Tickets por Dia',
      dataSource: 'prisma:business.operations.tickets.timeline',
      config: {
        days: 30,
        color: '#059669',
        showGrid: true,
      },
    },
  });

  console.log(`✅ Created ${2} widgets for Operations Dashboard`);

  // Create layouts for users
  console.log('🎨 Creating layouts...');

  await prisma.layout.create({
    data: {
      userId: analyst.id,
      dashboardId: salesDashboard.id,
      theme: Theme.LIGHT,
      layout: {
        lg: [
          { i: totalRevenueMetric.id, x: 0, y: 0, w: 3, h: 2 },
          { i: revenueWidget.id, x: 3, y: 0, w: 9, h: 4 },
          { i: salesByRegionWidget.id, x: 0, y: 2, w: 6, h: 4 },
          { i: productMixWidget.id, x: 6, y: 2, w: 6, h: 4 },
        ],
        md: [
          { i: totalRevenueMetric.id, x: 0, y: 0, w: 4, h: 2 },
          { i: revenueWidget.id, x: 4, y: 0, w: 8, h: 4 },
          { i: salesByRegionWidget.id, x: 0, y: 2, w: 6, h: 4 },
          { i: productMixWidget.id, x: 6, y: 2, w: 6, h: 4 },
        ],
        sm: [
          { i: totalRevenueMetric.id, x: 0, y: 0, w: 12, h: 2 },
          { i: revenueWidget.id, x: 0, y: 2, w: 12, h: 4 },
          { i: salesByRegionWidget.id, x: 0, y: 6, w: 12, h: 4 },
          { i: productMixWidget.id, x: 0, y: 10, w: 12, h: 4 },
        ],
      },
    },
  });

  await prisma.layout.create({
    data: {
      userId: analyst.id,
      dashboardId: marketingDashboard.id,
      theme: Theme.DARK,
      layout: {
        lg: [
          { i: conversionWidget.id, x: 0, y: 0, w: 6, h: 4 },
          { i: campaignPerformanceWidget.id, x: 6, y: 0, w: 6, h: 4 },
          { i: heatmapWidget.id, x: 0, y: 4, w: 12, h: 4 },
        ],
      },
    },
  });

  console.log(`✅ Created layouts`);

  // Share dashboards
  console.log('🔗 Creating dashboard shares...');

  await prisma.dashboardShare.create({
    data: {
      dashboardId: salesDashboard.id,
      userId: viewer.id,
      permission: 'VIEW',
    },
  });

  await prisma.dashboardShare.create({
    data: {
      dashboardId: marketingDashboard.id,
      userId: admin.id,
      permission: 'ADMIN',
    },
  });

  console.log(`✅ Created dashboard shares`);

  // Create scheduled reports
  console.log('📅 Creating scheduled reports...');

  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
  nextMonday.setHours(9, 0, 0, 0);

  await prisma.schedule.create({
    data: {
      userId: analyst.id,
      name: 'Weekly Sales Report',
      cronExpr: '0 9 * * 1', // Every Monday at 9 AM
      dashboardId: salesDashboard.id,
      format: [ExportFormat.PDF, ExportFormat.XLSX],
      recipients: ['manager@company.com', 'team@company.com'],
      isActive: true,
      nextRun: nextMonday,
    },
  });

  const firstDayNextMonth = new Date();
  firstDayNextMonth.setMonth(firstDayNextMonth.getMonth() + 1);
  firstDayNextMonth.setDate(1);
  firstDayNextMonth.setHours(8, 0, 0, 0);

  await prisma.schedule.create({
    data: {
      userId: admin.id,
      name: 'Monthly Operations Summary',
      cronExpr: '0 8 1 * *', // First day of month at 8 AM
      dashboardId: operationsDashboard.id,
      format: [ExportFormat.PDF],
      recipients: ['executives@company.com'],
      isActive: true,
      nextRun: firstDayNextMonth,
    },
  });

  console.log(`✅ Created scheduled reports`);

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin:   admin@dashboard.com / admin1307');
  console.log('   Analyst: analyst@dashboard.com / analyst1307');
  console.log('   Viewer:  viewer@dashboard.com / viewer1307');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
