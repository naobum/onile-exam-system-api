const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Создание и инициализация БД
const db = new sqlite3.Database('./exam_system.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключение к SQLite установлено');
        initializeDatabase();
    }
});

function initializeDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Выполнение схемы
        db.exec(schema, (err) => {
            if (err) {
                console.error('Ошибка создания схемы:', err);
            } else {
                console.log('Схема БД создана успешно');
                insertInitialData();
            }
        });
    } catch (err) {
        console.error('Ошибка чтения файла схемы:', err);
    }
}

function insertInitialData() {
    // Добавление ролей
    const roles = ['Админ', 'Преподаватель', 'Студент'];
    const insertRole = db.prepare("INSERT OR IGNORE INTO Roles (Название_Роли) VALUES (?)");
    
    roles.forEach(role => {
        insertRole.run([role]);
    });
    insertRole.finalize();

    // Создание администратора по умолчанию
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(
        `INSERT OR IGNORE INTO Users (Имя, Фамилия, Email, Пароль_Хэш, ID_Роли) 
         VALUES (?, ?, ?, ?, (SELECT ID_Роли FROM Roles WHERE Название_Роли = ?))`,
        ['Админ', 'Системы', 'admin@system.com', hashedPassword, 'Админ'],
        function(err) {
            if (err) {
                console.error('Ошибка создания администратора:', err);
            } else {
                console.log('Начальные данные добавлены');
                console.log('Логин: admin@system.com');
                console.log('Пароль: admin123');
            }
        }
    );
}

module.exports = db;