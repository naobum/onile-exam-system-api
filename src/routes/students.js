const express = require('express');
const router = express.Router();
const db = require('../database/init');
const bcrypt = require('bcryptjs');

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// Список студентов
router.get('/', requireAuth, (req, res) => {
    db.all(
        `SELECT u.*, r.Название_Роли as Роль 
         FROM Users u 
         JOIN Roles r ON u.ID_Роли = r.ID_Роли 
         WHERE r.Название_Роли = 'Студент'`,
        (err, students) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка сервера');
            }
            res.render('students', { 
                title: 'Управление студентами',
                students: students 
            });
        }
    );
});

// Форма создания студента
router.get('/create', requireAuth, (req, res) => {
    res.render('student_form', { 
        title: 'Добавить студента',
        student: null 
    });
});

// Создание студента
router.post('/create', requireAuth, (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    // Хэшируем пароль
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(
        `INSERT INTO Users (Имя, Фамилия, Email, Пароль_Хэш, ID_Роли) 
         VALUES (?, ?, ?, ?, (SELECT ID_Роли FROM Roles WHERE Название_Роли = 'Студент'))`,
        [firstName, lastName, email, hashedPassword],
        function(err) {
            if (err) {
                console.error(err);
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.render('student_form', { 
                        error: 'Пользователь с таким email уже существует',
                        student: { Имя: firstName, Фамилия: lastName, Email: email }
                    });
                }
                return res.status(500).send('Ошибка создания студента');
            }
            res.redirect('/students');
        }
    );
});

// Форма редактирования студента
router.get('/edit/:id', requireAuth, (req, res) => {
    const studentId = req.params.id;
    
    db.get(
        `SELECT * FROM Users WHERE ID_Пользователя = ? AND ID_Роли = (SELECT ID_Роли FROM Roles WHERE Название_Роли = 'Студент')`,
        [studentId],
        (err, student) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка сервера');
            }
            
            if (!student) {
                return res.status(404).send('Студент не найден');
            }
            
            res.render('student_form', { 
                title: 'Редактировать студента',
                student: student 
            });
        }
    );
});

// Обновление студента
router.post('/edit/:id', requireAuth, (req, res) => {
    const studentId = req.params.id;
    const { firstName, lastName, email, password } = req.body;
    
    if (password) {
        // Если пароль указан - обновляем с паролем
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run(
            'UPDATE Users SET Имя = ?, Фамилия = ?, Email = ?, Пароль_Хэш = ? WHERE ID_Пользователя = ?',
            [firstName, lastName, email, hashedPassword, studentId],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Ошибка обновления студента');
                }
                res.redirect('/students');
            }
        );
    } else {
        // Если пароль не указан - обновляем без пароля
        db.run(
            'UPDATE Users SET Имя = ?, Фамилия = ?, Email = ? WHERE ID_Пользователя = ?',
            [firstName, lastName, email, studentId],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Ошибка обновления студента');
                }
                res.redirect('/students');
            }
        );
    }
});

// Удаление студента
router.post('/delete/:id', requireAuth, (req, res) => {
    const studentId = req.params.id;
    
    db.run(
        'DELETE FROM Users WHERE ID_Пользователя = ?',
        [studentId],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка удаления студента');
            }
            res.redirect('/students');
        }
    );
});

module.exports = router;