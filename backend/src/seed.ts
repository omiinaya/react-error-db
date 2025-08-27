import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/auth.utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.solution.deleteMany();
  await prisma.errorCode.deleteMany();
  await prisma.application.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create users
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

  const [adminUser, regularUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@errdb.com',
        username: 'admin',
        passwordHash: adminPassword,
        displayName: 'Admin User',
        isVerified: true,
        isAdmin: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@errdb.com',
        username: 'user',
        passwordHash: userPassword,
        displayName: 'Regular User',
        isVerified: true,
      },
    }),
  ]);

  console.log('👥 Created users');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Programming Languages',
        slug: 'programming-languages',
        description: 'Errors related to programming languages',
        icon: 'code',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Web Frameworks',
        slug: 'web-frameworks',
        description: 'Errors related to web development frameworks',
        icon: 'globe',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Databases',
        slug: 'databases',
        description: 'Errors related to database systems',
        icon: 'database',
      },
    }),
  ]);

  console.log('📂 Created categories');

  // Create applications
  const applications = await Promise.all([
    // Programming Languages
    prisma.application.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript programming language errors and issues',
        logoUrl: '/logos/javascript.png',
        categoryId: categories[0].id,
        websiteUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        documentationUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference',
      },
    }),
    prisma.application.create({
      data: {
        name: 'Python',
        slug: 'python',
        description: 'Python programming language errors and issues',
        logoUrl: '/logos/python.png',
        categoryId: categories[0].id,
        websiteUrl: 'https://www.python.org',
        documentationUrl: 'https://docs.python.org/3/',
      },
    }),
    // Web Frameworks
    prisma.application.create({
      data: {
        name: 'React',
        slug: 'react',
        description: 'React JavaScript library for building user interfaces',
        logoUrl: '/logos/react.png',
        categoryId: categories[1].id,
        websiteUrl: 'https://reactjs.org',
        documentationUrl: 'https://reactjs.org/docs/',
      },
    }),
    prisma.application.create({
      data: {
        name: 'Express.js',
        slug: 'expressjs',
        description: 'Fast, unopinionated, minimalist web framework for Node.js',
        logoUrl: '/logos/express.png',
        categoryId: categories[1].id,
        websiteUrl: 'https://expressjs.com',
        documentationUrl: 'https://expressjs.com/en/4x/api.html',
      },
    }),
    // Databases
    prisma.application.create({
      data: {
        name: 'PostgreSQL',
        slug: 'postgresql',
        description: 'Powerful open source object-relational database system',
        logoUrl: '/logos/postgresql.png',
        categoryId: categories[2].id,
        websiteUrl: 'https://www.postgresql.org',
        documentationUrl: 'https://www.postgresql.org/docs/',
      },
    }),
    prisma.application.create({
      data: {
        name: 'MongoDB',
        slug: 'mongodb',
        description: 'Document-oriented NoSQL database',
        logoUrl: '/logos/mongodb.png',
        categoryId: categories[2].id,
        websiteUrl: 'https://www.mongodb.com',
        documentationUrl: 'https://docs.mongodb.com/',
      },
    }),
  ]);

  console.log('🚀 Created applications');

  // Create error codes
  const errorCodes = await Promise.all([
    // JavaScript errors
    prisma.errorCode.create({
      data: {
        code: 'TypeError',
        applicationId: applications[0].id,
        title: 'Cannot read property of undefined',
        description: 'This error occurs when trying to access a property on an undefined or null value.',
        severity: 'medium',
        metadata: {
          commonCauses: [
            'Accessing object properties before initialization',
            'Misspelled property names',
            'Async operations not completed'
          ],
          relatedDocs: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError'
        },
      },
    }),
    prisma.errorCode.create({
      data: {
        code: 'ReferenceError',
        applicationId: applications[0].id,
        title: 'Variable is not defined',
        description: 'This error occurs when trying to access a variable that has not been declared.',
        severity: 'medium',
        metadata: {
          commonCauses: [
            'Misspelled variable names',
            'Variables declared in different scope',
            'Using variables before declaration'
          ],
          relatedDocs: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError'
        },
      },
    }),
    // React errors
    prisma.errorCode.create({
      data: {
        code: 'E0435',
        applicationId: applications[2].id,
        title: 'Invalid hook call',
        description: 'Hooks can only be called inside the body of a function component.',
        severity: 'high',
        metadata: {
          commonCauses: [
            'Calling hooks in class components',
            'Calling hooks conditionally',
            'Calling hooks in regular JavaScript functions'
          ],
          relatedDocs: 'https://reactjs.org/warnings/invalid-hook-call-warning.html'
        },
      },
    }),
    prisma.errorCode.create({
      data: {
        code: 'E2946',
        applicationId: applications[2].id,
        title: 'Maximum update depth exceeded',
        description: 'This error occurs when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.',
        severity: 'high',
        metadata: {
          commonCauses: [
            'Infinite render loops',
            'Setting state in render method',
            'Incorrect useEffect dependencies'
          ],
          relatedDocs: 'https://reactjs.org/docs/error-boundaries.html'
        },
      },
    }),
    // PostgreSQL errors
    prisma.errorCode.create({
      data: {
        code: '23505',
        applicationId: applications[4].id,
        title: 'Unique violation',
        description: 'Duplicate key value violates unique constraint.',
        severity: 'medium',
        metadata: {
          commonCauses: [
            'Inserting duplicate primary keys',
            'Violating unique constraints',
            'Race conditions in concurrent inserts'
          ],
          relatedDocs: 'https://www.postgresql.org/docs/current/errcodes-appendix.html'
        },
      },
    }),
  ]);

  console.log('❌ Created error codes');

  // Create solutions
  const solutions = await Promise.all([
    // Solution for JavaScript TypeError
    prisma.solution.create({
      data: {
        errorId: errorCodes[0].id,
        authorId: adminUser.id,
        solutionText: `To fix "Cannot read property of undefined":

1. Check if the object exists before accessing properties:
   \`\`\`javascript
   if (obj && obj.property) {
     // Safe to access
   }
   \`\`\`

2. Use optional chaining (ES2020+):
   \`\`\`javascript
   const value = obj?.property;
   \`\`\`

3. Provide default values:
   \`\`\`javascript
   const value = obj?.property ?? 'default';
   \`\`\`

4. Debug by checking where the object becomes undefined.`,
        upvotes: 15,
        downvotes: 2,
        isVerified: true,
        verifiedById: adminUser.id,
        verifiedAt: new Date(),
      },
    }),
    // Solution for React invalid hook call
    prisma.solution.create({
      data: {
        errorId: errorCodes[2].id,
        authorId: regularUser.id,
        solutionText: `To fix "Invalid hook call" in React:

1. Ensure you're using hooks only in functional components:
   \`\`\`javascript
   // ✅ Correct
   function MyComponent() {
     const [state, setState] = useState();
     return <div>Hello</div>;
   }

   // ❌ Wrong
   class MyComponent extends React.Component {
     useState() { ... } // Cannot use hooks in classes
   }
   \`\`\`

2. Don't call hooks conditionally:
   \`\`\`javascript
   // ✅ Correct
   function MyComponent() {
     const [state, setState] = useState();
     if (condition) {
       // Use state here
     }
   }

   // ❌ Wrong
   function MyComponent() {
     if (condition) {
       const [state, setState] = useState(); // Conditional hook call
     }
   }
   \`\`\`

3. Check for multiple React versions in your project.`,
        upvotes: 8,
        downvotes: 1,
        isVerified: true,
        verifiedById: adminUser.id,
        verifiedAt: new Date(),
      },
    }),
  ]);

  console.log('💡 Created solutions');

  // Create some votes
  await Promise.all([
    prisma.vote.create({
      data: {
        solutionId: solutions[0].id,
        userId: regularUser.id,
        voteType: 'upvote',
      },
    }),
    prisma.vote.create({
      data: {
        solutionId: solutions[1].id,
        userId: adminUser.id,
        voteType: 'upvote',
      },
    }),
  ]);

  console.log('👍 Created votes');

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('📋 Sample data created:');
  console.log(`- Users: 2 (admin@errdb.com / admin123, user@errdb.com / user123)`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Applications: ${applications.length}`);
  console.log(`- Error codes: ${errorCodes.length}`);
  console.log(`- Solutions: ${solutions.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });