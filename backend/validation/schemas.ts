import { ExportFormat, Role, WidgetType } from '@prisma/client';
import { z } from 'zod';

const nonEmptyString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const optionalTrimmedString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const authLoginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const authRegisterSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: nonEmptyString('Name').max(200, 'Name must be less than 200 characters'),
  role: z.nativeEnum(Role).optional(),
});

export const dashboardCreateSchema = z.object({
  title: nonEmptyString('Dashboard title').max(
    200,
    'Dashboard title must be less than 200 characters'
  ),
  description: optionalTrimmedString.refine(
    (value) => value === undefined || value.length <= 1000,
    'Dashboard description must be less than 1000 characters'
  ),
  isPublic: z.boolean().optional(),
});

export const dashboardUpdateSchema = z.object({
  title: nonEmptyString('Dashboard title')
    .max(200, 'Dashboard title must be less than 200 characters')
    .optional(),
  description: optionalTrimmedString
    .refine(
      (value) => value === undefined || value.length <= 1000,
      'Dashboard description must be less than 1000 characters'
    )
    .optional(),
  isPublic: z.boolean().optional(),
});

const widgetConfigSchema = z
  .unknown()
  .refine(
    (value) => typeof value === 'object' && value !== null,
    'Widget config must be an object'
  );

export const widgetCreateSchema = z.object({
  dashboardId: nonEmptyString('Dashboard ID'),
  type: z.nativeEnum(WidgetType),
  title: nonEmptyString('Widget title').max(
    200,
    'Widget title must be less than 200 characters'
  ),
  config: widgetConfigSchema,
  dataSource: nonEmptyString('Widget data source'),
});

export const widgetUpdateSchema = z.object({
  type: z.nativeEnum(WidgetType).optional(),
  title: nonEmptyString('Widget title')
    .max(200, 'Widget title must be less than 200 characters')
    .optional(),
  config: widgetConfigSchema.optional(),
  dataSource: nonEmptyString('Widget data source').optional(),
});

export const scheduleCreateSchema = z.object({
  name: nonEmptyString('Schedule name'),
  cronExpr: nonEmptyString('CRON expression'),
  dashboardId: nonEmptyString('Dashboard ID'),
  format: z.array(z.nativeEnum(ExportFormat)).min(1).optional(),
  recipients: z.array(z.string().trim().email('Invalid recipient email')).min(
    1,
    'At least one recipient is required'
  ),
});

export const scheduleUpdateSchema = z.object({
  name: nonEmptyString('Schedule name').optional(),
  cronExpr: nonEmptyString('CRON expression').optional(),
  format: z.array(z.nativeEnum(ExportFormat)).min(1).optional(),
  recipients: z.array(z.string().trim().email('Invalid recipient email')).min(1).optional(),
  isActive: z.boolean().optional(),
});
