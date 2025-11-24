import * as bcrypt from 'bcryptjs';

async function hashPassword(password: string) {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n🔒 Password Hash Generated:');
    console.log(hash);
    console.log('\nUse this command to update in database:');
    console.log(`UPDATE "User" SET password = '${hash}' WHERE email = 'admin@dashboard.com';`);
}

const password = process.argv[2] || 'admin123';
console.log(`\n📝 Generating hash for password: "${password}"\n`);
hashPassword(password);
