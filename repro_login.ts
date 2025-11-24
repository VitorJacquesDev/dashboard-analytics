
import { authService } from './backend/services/AuthService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing login with admin@dashboard.com...');
        const result = await authService.login('admin@dashboard.com', 'admin123');
        console.log('Login successful!');
        console.log('Token:', result.token ? 'Present' : 'Missing');
        console.log('User:', result.user.email);
    } catch (error) {
        console.error('Login failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
