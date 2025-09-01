import prisma from '../src/services/database.service';

async function checkUserThemes() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        themePreference: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('User Theme Preferences:');
    console.log('======================');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Theme Preference: ${user.themePreference || 'NULL (no preference)'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---');
    });

    console.log(`Total users: ${users.length}`);
  } catch (error) {
    console.error('Error checking user themes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserThemes();