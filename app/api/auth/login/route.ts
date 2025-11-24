import { NextRequest, NextResponse } from 'next/server';
import { authController } from '@/backend/controllers/AuthController';

export const POST = async (req: NextRequest) => {
    console.log('API Login request received');
    const res = await authController.login(req);
    console.log('API Login response status:', res.status);
    return res;
};
