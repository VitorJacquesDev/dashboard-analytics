import { NextRequest } from 'next/server';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  req: NextRequest,
  schema: TSchema
): Promise<ZodInfer<TSchema>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new Error('Invalid JSON payload');
  }

  return schema.parse(body);
}
