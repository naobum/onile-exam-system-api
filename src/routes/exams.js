const express = require('express');
const router = express.Router();
const db = require('../database/init');

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// Список шаблонов экзаменов
router.get('/', requireAuth, (req, res) => {
    db.all(
        `SELECT et.*, u.Имя, u.Фамилия 
         FROM Exam_Templates et 
         JOIN Users u ON et.ID_Преподавателя = u.ID_Пользователя 
         WHERE et.ID_Преподавателя = ?`,
        [req.session.user.ID_Пользователя],
        (err, exams) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка сервера');
            }
            res.render('exams', { 
                title: 'Шаблоны экзаменов',
                exams: exams 
            });
        }
    );
});

// Создание шаблона экзамена
router.post('/create', requireAuth, (req, res) => {
    const { name, duration } = req.body;
    
    db.run(
        'INSERT INTO Exam_Templates (Название, Длительность_мин, ID_Преподавателя) VALUES (?, ?, ?)',
        [name, duration, req.session.user.ID_Пользователя],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка создания шаблона');
            }
            res.redirect('/exams');
        }
    );
});

module.exports = router;