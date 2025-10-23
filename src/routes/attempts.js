const express = require('express');
const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// Список попыток
router.get('/', requireAuth, (req, res) => {
    res.render('attempts', { 
        title: 'Попытки экзаменов',
        attempts: [] 
    });
});

module.exports = router;