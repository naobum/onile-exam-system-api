const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/init');

// Страница входа
router.get('/login', (req, res) => {
    res.render('login', { title: 'Вход в систему' });
});

// Процесс входа
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(
        `SELECT u.*, r.Название_Роли as Роль 
         FROM Users u 
         JOIN Roles r ON u.ID_Роли = r.ID_Роли 
         WHERE u.Email = ?`,
        [email],
        (err, user) => {
            if (err) {
                console.error(err);
                return res.render('login', { error: 'Ошибка базы данных' });
            }
            
            if (!user || !bcrypt.compareSync(password, user.Пароль_Хэш)) {
                return res.render('login', { error: 'Неверный email или пароль' });
            }
            
            req.session.user = user;
            res.redirect('/');
        }
    );
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;