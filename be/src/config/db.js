const mysql = require('mysql2/promise')
import { env } from '../config/environment'

const connection = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    connectTimeout: 10000
})

async function testConnection() {
    try {
        const conn = await connection.getConnection()
        console.log('Connected to database.')
        conn.release()
    } catch (err) {
        console.error('Database connection failed:', err.stack)
    }
}

testConnection()

module.exports = connection