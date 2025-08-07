import fs from 'fs';
import path from 'path';
import db from './src/config/db.js';

const runMigration = async () => {
    try {
        console.log('Running migration: add_time_tracking_to_cards.sql');
        
        // Read migration file
        const migrationPath = path.join(process.cwd(), 'migrations', 'add_time_tracking_to_cards.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL statements
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim());
                await db.query(statement);
            }
        }
        
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
