const express = require('express');
const router = express.Router();
const db = require('../database/init');

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
}

// Вопросы в банке
router.get('/bank/:bankId', requireAuth, (req, res) => {
    const bankId = req.params.bankId;
    
    db.all(
        `SELECT q.*, COUNT(aq.ID_Варианта) as Вариантов_Ответа
         FROM Questions q 
         LEFT JOIN Answer_Options aq ON q.ID_Вопроса = aq.ID_Вопроса
         WHERE q.ID_Банка = ?
         GROUP BY q.ID_Вопроса`,
        [bankId],
        (err, questions) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка сервера');
            }
            
            db.get(
                'SELECT * FROM Question_Banks WHERE ID_Банка = ?',
                [bankId],
                (err, bank) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Ошибка сервера');
                    }
                    
                    res.render('questions', {
                        title: `Вопросы банка "${bank.Название}"`,
                        questions: questions,
                        bank: bank
                    });
                }
            );
        }
    );
});

// Создание вопроса
router.post('/create', requireAuth, (req, res) => {
    const { bankId, questionText, questionType, defaultScore } = req.body;
    
    db.run(
        'INSERT INTO Questions (Текст_Вопроса, Тип_Вопроса, Балл_По_Умолчанию, ID_Банка) VALUES (?, ?, ?, ?)',
        [questionText, questionType, defaultScore, bankId],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка создания вопроса');
            }
            res.redirect(`/questions/bank/${bankId}`);
        }
    );
});

module.exports = router;