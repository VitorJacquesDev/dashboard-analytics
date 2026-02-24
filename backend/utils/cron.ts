import cron from 'node-cron';
import { CronExpressionParser } from 'cron-parser';

export function isValidCronExpression(expr: string): boolean {
  if (!expr || !expr.trim()) {
    return false;
  }

  if (!cron.validate(expr)) {
    return false;
  }

  try {
    CronExpressionParser.parse(expr, { currentDate: new Date() });
    return true;
  } catch {
    return false;
  }
}

export function getNextRunFromCron(expr: string, fromDate: Date = new Date()): Date {
  const parsed = CronExpressionParser.parse(expr, { currentDate: fromDate });
  return parsed.next().toDate();
}
