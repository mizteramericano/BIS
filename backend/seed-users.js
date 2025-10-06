const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mitsubishi_bis'
    });

    try {
        console.log('Starting to seed users and manager relationships...');

        // Hash password for all users (using simple password for demo)
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('password123', salt);

        // Create sample users with different roles
        const users = [
            // Executives (role_id = 3)
            { employee_id: 1, username: 'somchai.j', password_hash: defaultPassword, role_id: 3 },  // CEO level
            { employee_id: 30, username: 'sunee.a', password_hash: defaultPassword, role_id: 3 },   // Senior Executive

            // Managers (role_id = 2)
            { employee_id: 5, username: 'tana.c', password_hash: defaultPassword, role_id: 2 },     // Finance Manager
            { employee_id: 9, username: 'wilai.s', password_hash: defaultPassword, role_id: 2 },    // Manufacturing Manager
            { employee_id: 16, username: 'malee.j', password_hash: defaultPassword, role_id: 2 },   // Finance Manager
            { employee_id: 37, username: 'jiraporn.p', password_hash: defaultPassword, role_id: 2 }, // Sales Manager
            { employee_id: 43, username: 'danai.c', password_hash: defaultPassword, role_id: 2 },   // HR Manager
            { employee_id: 51, username: 'usa.s', password_hash: defaultPassword, role_id: 2 },     // IT Manager
            { employee_id: 58, username: 'laong.d', password_hash: defaultPassword, role_id: 2 },   // Sales Manager
            { employee_id: 64, username: 'worawut.j', password_hash: defaultPassword, role_id: 2 }, // HR Manager
            { employee_id: 72, username: 'siriporn.m', password_hash: defaultPassword, role_id: 2 }, // IT Manager
            { employee_id: 79, username: 'somjit.d', password_hash: defaultPassword, role_id: 2 },  // Manufacturing Manager
            { employee_id: 86, username: 'potjanee.d', password_hash: defaultPassword, role_id: 2 }, // Finance Manager
            { employee_id: 93, username: 'jantima.s', password_hash: defaultPassword, role_id: 2 }, // HR Manager

            // HR Staff (role_id = 4)
            { employee_id: 3, username: 'wichai.m', password_hash: defaultPassword, role_id: 4 },   // HR Supervisor
            { employee_id: 4, username: 'pranee.s', password_hash: defaultPassword, role_id: 4 },   // HR Senior

            // Regular Employees (role_id = 1)
            { employee_id: 2, username: 'somying.r', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 6, username: 'surachai.w', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 7, username: 'janjira.s', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 8, username: 'prayuth.s', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 10, username: 'anucha.p', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 11, username: 'kanokwan.t', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 12, username: 'chaiwat.m', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 13, username: 'boonchou.r', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 14, username: 'supaporn.p', password_hash: defaultPassword, role_id: 1 },
            { employee_id: 15, username: 'veera.s', password_hash: defaultPassword, role_id: 1 },
        ];

        // Insert users
        for (const user of users) {
            await connection.query(`
                INSERT INTO users (employee_id, username, password_hash, role_id, is_active)
                VALUES (?, ?, ?, ?, TRUE)
                ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
            `, [user.employee_id, user.username, user.password_hash, user.role_id]);
        }
        console.log(`✓ Created ${users.length} users`);

        // Create manager-subordinate relationships
        const managerRelationships = [
            // IT Department (department_id = 1)
            { manager_id: 51, subordinate_id: 1, department_id: 1 },   // usa.s manages somchai.j
            { manager_id: 51, subordinate_id: 2, department_id: 1 },   // usa.s manages somying.r
            { manager_id: 51, subordinate_id: 11, department_id: 1 },  // usa.s manages kanokwan.t
            { manager_id: 51, subordinate_id: 12, department_id: 1 },  // usa.s manages chaiwat.m
            { manager_id: 72, subordinate_id: 22, department_id: 1 },  // siriporn.m manages others
            { manager_id: 72, subordinate_id: 31, department_id: 1 },

            // HR Department (department_id = 2)
            { manager_id: 43, subordinate_id: 3, department_id: 2 },   // danai.c manages wichai.m
            { manager_id: 43, subordinate_id: 4, department_id: 2 },   // danai.c manages pranee.s
            { manager_id: 43, subordinate_id: 13, department_id: 2 },  // danai.c manages boonchou.r
            { manager_id: 64, subordinate_id: 23, department_id: 2 },  // worawut.j manages others
            { manager_id: 64, subordinate_id: 24, department_id: 2 },
            { manager_id: 93, subordinate_id: 33, department_id: 2 },  // jantima.s manages others

            // Finance Department (department_id = 3)
            { manager_id: 5, subordinate_id: 6, department_id: 3 },    // tana.c manages surachai.w
            { manager_id: 5, subordinate_id: 15, department_id: 3 },   // tana.c manages veera.s
            { manager_id: 16, subordinate_id: 25, department_id: 3 },  // malee.j manages others
            { manager_id: 16, subordinate_id: 26, department_id: 3 },
            { manager_id: 86, subordinate_id: 35, department_id: 3 },  // potjanee.d manages others

            // Sales Department (department_id = 4)
            { manager_id: 37, subordinate_id: 7, department_id: 4 },   // jiraporn.p manages janjira.s
            { manager_id: 37, subordinate_id: 8, department_id: 4 },   // jiraporn.p manages prayuth.s
            { manager_id: 58, subordinate_id: 18, department_id: 4 },  // laong.d manages others
            { manager_id: 58, subordinate_id: 27, department_id: 4 },

            // Manufacturing Department (department_id = 5)
            { manager_id: 9, subordinate_id: 10, department_id: 5 },   // wilai.s manages anucha.p
            { manager_id: 79, subordinate_id: 19, department_id: 5 },  // somjit.d manages others
            { manager_id: 79, subordinate_id: 20, department_id: 5 },
        ];

        // Insert manager-subordinate relationships
        for (const rel of managerRelationships) {
            await connection.query(`
                INSERT INTO manager_subordinates (manager_id, subordinate_id, department_id, start_date, is_active)
                VALUES (?, ?, ?, CURDATE(), TRUE)
                ON DUPLICATE KEY UPDATE is_active = TRUE
            `, [rel.manager_id, rel.subordinate_id, rel.department_id]);
        }
        console.log(`✓ Created ${managerRelationships.length} manager-subordinate relationships`);

        console.log('\n=== Sample Login Credentials ===');
        console.log('Executive:');
        console.log('  Username: somchai.j  Password: password123  (CEO level)');
        console.log('  Username: sunee.a    Password: password123  (Senior Executive)');
        console.log('\nManagers:');
        console.log('  Username: tana.c     Password: password123  (Finance Manager)');
        console.log('  Username: usa.s      Password: password123  (IT Manager)');
        console.log('  Username: danai.c    Password: password123  (HR Manager)');
        console.log('\nHR Staff:');
        console.log('  Username: wichai.m   Password: password123  (HR Supervisor)');
        console.log('\nEmployees:');
        console.log('  Username: somying.r  Password: password123  (IT Employee)');
        console.log('  Username: janjira.s  Password: password123  (Sales Employee)');
        console.log('\nAll passwords are: password123');

    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

seedUsers()
    .then(() => {
        console.log('\n✓ User seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed users:', error);
        process.exit(1);
    });
