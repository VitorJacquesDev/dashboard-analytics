import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/backend/middleware/auth';
import { shareService } from '@/backend/services/ShareService';

/**
 * GET /api/dashboards/[id]/share - List all shares for a dashboard
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const shares = await shareService.getSharedWith(dashboardId, authResult.user.id);
        return NextResponse.json(shares);
    } catch (error: any) {
        if (error.message === 'Dashboard not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message === 'Access denied') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/dashboards/[id]/share - Share dashboard with a user
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const body = await req.json();

        if (!body.email && !body.userId) {
            return NextResponse.json(
                { error: 'Either email or userId is required' },
                { status: 400 }
            );
        }

        const permission = body.permission || 'VIEW';
        if (!['VIEW', 'EDIT'].includes(permission)) {
            return NextResponse.json(
                { error: 'Permission must be VIEW or EDIT' },
                { status: 400 }
            );
        }

        let share;
        if (body.email) {
            share = await shareService.shareByEmail(
                dashboardId,
                body.email,
                permission,
                authResult.user.id
            );
        } else {
            share = await shareService.share(
                dashboardId,
                body.userId,
                permission,
                authResult.user.id
            );
        }

        return NextResponse.json(share, { status: 201 });
    } catch (error: any) {
        if (error.message === 'Dashboard not found' || error.message === 'User not found' || error.message === 'User with this email not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message.includes('Only dashboard owner') || error.message.includes('Cannot share')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

/**
 * DELETE /api/dashboards/[id]/share - Revoke access (requires userId in query)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { id: dashboardId } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId query parameter is required' },
                { status: 400 }
            );
        }

        await shareService.revoke(dashboardId, userId, authResult.user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === 'Dashboard not found' || error.message === 'Share not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message.includes('Only dashboard owner')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
