const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Middleware проверки авторизации
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// Список банков вопросов
router.get('/', requireAuth, (req, res) => {
    db.all(
        `SELECT qb.*, u.Имя, u.Фамилия 
         FROM Question_Banks qb 
         JOIN Users u ON qb.ID_Преподавателя = u.ID_Пользователя 
         WHERE qb.ID_Преподавателя = ?`,
        [req.session.user.ID_Пользователя],
        (err, banks) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка сервера');
            }
            res.render('banks', { 
                title: 'Банки вопросов',
                banks: banks 
            });
        }
    );
});

// Создание банка
router.post('/create', requireAuth, (req, res) => {
    const { name } = req.body;
    
    db.run(
        'INSERT INTO Question_Banks (Название, ID_Преподавателя) VALUES (?, ?)',
        [name, req.session.user.ID_Пользователя],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка создания банка');
            }
            res.redirect('/banks');
        }
    );
});

module.exports = router;