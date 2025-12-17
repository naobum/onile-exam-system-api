const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DBSOURCE = process.env.DB_SOURCE || "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        
        // Создание таблиц
        db.serialize(() => {
            // 1. Пользователи
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT CHECK(role IN ('admin', 'teacher', 'student'))
            )`);

            // 2. Банки вопросов
            db.run(`CREATE TABLE IF NOT EXISTS banks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                created_by INTEGER
            )`);

            // 3. Вопросы (храним варианты ответов в JSON)
            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bank_id INTEGER,
                text TEXT,
                options JSON, 
                correct_answer TEXT,
                FOREIGN KEY(bank_id) REFERENCES banks(id)
            )`);

            // 4. Шаблоны экзаменов
            db.run(`CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                settings JSON, 
                created_by INTEGER
            )`); 
            // settings пример: { "bank_id": 1, "count": 10, "duration_minutes": 60 }

            // 5. Допуски (Admit)
            db.run(`CREATE TABLE IF NOT EXISTS admissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                template_id INTEGER,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(template_id) REFERENCES templates(id)
            )`);

            // 6. Попытки и Ответы
            db.run(`CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                template_id INTEGER,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'in_progress'
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attempt_id INTEGER,
                question_id INTEGER,
                student_answer TEXT
            )`);

            // Создаем тестового админа (пароль: admin123)
            const hash = bcrypt.hashSync("admin123", 10);
            db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', ?, 'admin')`, [hash]);
        });
    }
});

module.exports = db;