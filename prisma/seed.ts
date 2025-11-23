import { PrismaClient, Role, WidgetType, Theme, ExportFormat } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.schedule.deleteMany();
    await prisma.dashboardShare.deleteMany();
    await prisma.layout.deleteMany();
    await prisma.widget.deleteMany();
    await prisma.dashboard.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create users with different roles
  console.log('👤 Creating users...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dashboard.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  const analystPassword = await bcrypt.hash('analyst123', 10);
  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@dashboard.com',
      password: analystPassword,
      name: 'Analyst User',
      role: Role.ANALYST,
    },
  });
  console.log(`✅ Created analyst user: ${analyst.email}`);

  const viewerPassword = await bcrypt.hash('viewer123', 10);
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

  // Create widgets for Sales Dashboard
  console.log('📈 Creating widgets...');

  const revenueWidget = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.LINE_CHART,
      title: 'Monthly Revenue Trend',
      dataSource: 'sales.revenue',
      config: {
        xAxis: 'month',
        yAxis: 'revenue',
        color: '#3b82f6',
        showGrid: true,
        enableZoom: true,
      },
    },
  });

  const salesByRegionWidget = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.BAR_CHART,
      title: 'Sales by Region',
      dataSource: 'sales.by_region',
      config: {
        xAxis: 'region',
        yAxis: 'sales',
        color: '#10b981',
        orientation: 'vertical',
      },
    },
  });

  const productMixWidget = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.PIE_CHART,
      title: 'Product Mix',
      dataSource: 'sales.product_mix',
      config: {
        labelField: 'product',
        valueField: 'percentage',
        showLegend: true,
      },
    },
  });

  const totalRevenueMetric = await prisma.widget.create({
    data: {
      dashboardId: salesDashboard.id,
      type: WidgetType.METRIC,
      title: 'Total Revenue',
      dataSource: 'sales.total_revenue',
      config: {
        format: 'currency',
        prefix: '$',
        showTrend: true,
      },
    },
  });

  console.log(`✅ Created ${4} widgets for Sales Dashboard`);

  // Create widgets for Marketing Dashboard
  const conversionWidget = await prisma.widget.create({
    data: {
      dashboardId: marketingDashboard.id,
      type: WidgetType.AREA_CHART,
      title: 'Conversion Funnel',
      dataSource: 'marketing.conversion_funnel',
      config: {
        xAxis: 'stage',
        yAxis: 'count',
        stacked: true,
        colors: ['#8b5cf6', '#ec4899', '#f59e0b'],
      },
    },
  });

  const campaignPerformanceWidget = await prisma.widget.create({
    data: {
      dashboardId: marketingDashboard.id,
      type: WidgetType.SCATTER_CHART,
      title: 'Campaign Performance',
      dataSource: 'marketing.campaigns',
      config: {
        xAxis: 'spend',
        yAxis: 'roi',
        sizeField: 'impressions',
        colorField: 'channel',
      },
    },
  });

  const heatmapWidget = await prisma.widget.create({
    data: {
      dashboardId: marketingDashboard.id,
      type: WidgetType.HEATMAP,
      title: 'User Activity Heatmap',
      dataSource: 'marketing.user_activity',
      config: {
        xAxis: 'hour',
        yAxis: 'day',
        valueField: 'activity',
        colorScale: 'blues',
      },
    },
  });

  console.log(`✅ Created ${3} widgets for Marketing Dashboard`);

  // Create widgets for Operations Dashboard
  const kpiTableWidget = await prisma.widget.create({
    data: {
      dashboardId: operationsDashboard.id,
      type: WidgetType.TABLE,
      title: 'Key Performance Indicators',
      dataSource: 'operations.kpis',
      config: {
        columns: ['metric', 'current', 'target', 'status'],
        sortable: true,
        filterable: true,
      },
    },
  });

  const uptimeWidget = await prisma.widget.create({
    data: {
      dashboardId: operationsDashboard.id,
      type: WidgetType.LINE_CHART,
      title: 'System Uptime',
      dataSource: 'operations.uptime',
      config: {
        xAxis: 'timestamp',
        yAxis: 'uptime_percentage',
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
  console.log('   Admin:   admin@dashboard.com / admin123');
  console.log('   Analyst: analyst@dashboard.com / analyst123');
  console.log('   Viewer:  viewer@dashboard.com / viewer123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
