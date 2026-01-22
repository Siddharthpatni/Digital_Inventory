const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/inventory.db');
const SALT_ROUNDS = 10;

const db = new sqlite3.Database(DB_PATH);

console.log('🔐 Initializing User Authentication System...');
console.log('==========================================\n');

db.serialize(() => {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating users table:', err);
        } else {
            console.log('✅ Users table created/verified');
        }
    });

    // Create sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expired INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating sessions table:', err);
        } else {
            console.log('✅ Sessions table created/verified');
        }
    });

    // Check if demo users already exist
    db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (err) {
            console.error('❌ Error checking users:', err);
            db.close();
            return;
        }

        if (row.count > 0) {
            console.log(`\n📊 Found ${row.count} existing user(s)`);
            console.log('Skipping demo user creation.');
            db.close();
            return;
        }

        console.log('\n👥 Creating demo users...');

        // Demo users
        const demoUsers = [
            {
                username: 'admin',
                password: 'manager123',
                full_name: 'John Manager',
                email: 'admin@inventory.com',
                role: 'Manager'
            },
            {
                username: 'sales',
                password: 'sales123',
                full_name: 'Sarah Sales',
                email: 'sales@inventory.com',
                role: 'Sales Staff'
            },
            {
                username: 'warehouse',
                password: 'warehouse123',
                full_name: 'Mike Warehouse',
                email: 'warehouse@inventory.com',
                role: 'Warehouse Staff'
            }
        ];

        // Insert demo users with hashed passwords
        const insertPromises = demoUsers.map(user => {
            return new Promise((resolve, reject) => {
                bcrypt.hash(user.password, SALT_ROUNDS, (err, hash) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    db.run(
                        `INSERT INTO users (username, password, full_name, email, role)
                         VALUES (?, ?, ?, ?, ?)`,
                        [user.username, hash, user.full_name, user.email, user.role],
                        function (err) {
                            if (err) {
                                console.error(`❌ Error creating user ${user.username}:`, err);
                                reject(err);
                            } else {
                                console.log(`   ✓ Created user: ${user.username} (${user.role})`);
                                resolve(this.lastID);
                            }
                        }
                    );
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                console.log('\n✅ User Authentication System Initialized!');
                console.log('========================================');
                console.log('\n📝 Demo Login Credentials:');
                console.log('─────────────────────────────────────');
                demoUsers.forEach(user => {
                    console.log(`\n${user.role}:`);
                    console.log(`  Username: ${user.username}`);
                    console.log(`  Password: ${user.password}`);
                });
                console.log('\n');
            })
            .catch(err => {
                console.error('❌ Error creating demo users:', err);
            })
            .finally(() => {
                db.close();
            });
    });
});
