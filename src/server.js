const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');
const path = require('path');
const { authenticateToken, requireRole } = require('./middleware');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// --- БЛОК A: Аутентификация ---

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }
    const hash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password, role) VALUES (?,?,?)';
    db.run(sql, [username, hash, role], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User registered", id: this.lastID });
    });
});

// Логин
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: "User not found" });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Wrong password" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, role: user.role });
    });
});

// --- БЛОК B: Банк знаний (Только Преподаватель) ---

// Создание банка
app.post('/api/banks', authenticateToken, requireRole('teacher'), (req, res) => {
    const { title } = req.body;
    db.run('INSERT INTO banks (title, created_by) VALUES (?,?)', [title, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title });
    });
});

// Создание вопроса
app.post('/api/questions', authenticateToken, requireRole('teacher'), (req, res) => {
    const { bankId, text, options, correctAnswer } = req.body;
    // options ожидается как массив строк ["A", "B", "C"]
    const optionsJson = JSON.stringify(options); 
    
    db.run('INSERT INTO questions (bank_id, text, options, correct_answer) VALUES (?,?,?,?)', 
        [bankId, text, optionsJson, correctAnswer], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Question added" });
    });
});

// Создание шаблона экзамена
app.post('/api/templates', authenticateToken, requireRole('teacher'), (req, res) => {
    const { title, settings } = req.body; // settings: { bankId: 1, count: 5 }
    db.run('INSERT INTO templates (title, settings, created_by) VALUES (?,?,?)', 
        [title, JSON.stringify(settings), req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Template created" });
    });
});

// --- БЛОК C: Процесс Экзамена ---

// 1. Выдача допуска (Преподаватель)
app.post('/api/exam/admit', authenticateToken, requireRole('teacher'), (req, res) => {
    const { studentId, templateId } = req.body;
    db.run('INSERT INTO admissions (student_id, template_id) VALUES (?,?)', 
        [studentId, templateId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Student admitted to exam" });
    });
});

// 2. Старт экзамена (Студент)
app.post('/api/exam/start/:templateId', authenticateToken, requireRole('student'), (req, res) => {
    const templateId = req.params.templateId;
    const studentId = req.user.id;

    // Проверяем допуск
    db.get('SELECT * FROM admissions WHERE student_id = ? AND template_id = ?', [studentId, templateId], (err, admission) => {
        if (!admission) return res.status(403).json({ error: "No admission found for this exam" });

        // Создаем попытку
        db.run('INSERT INTO attempts (student_id, template_id) VALUES (?,?)', [studentId, templateId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const attemptId = this.lastID;

            // Получаем настройки шаблона, чтобы выбрать вопросы
            db.get('SELECT settings FROM templates WHERE id = ?', [templateId], (err, template) => {
                const settings = JSON.parse(template.settings);
                
                // ВЫБОРКА СЛУЧАЙНЫХ ВОПРОСОВ (упрощенная логика)
                db.all('SELECT id, text, options FROM questions WHERE bank_id = ? ORDER BY RANDOM() LIMIT ?', 
                    [settings.bankId, settings.count || 5], (err, questions) => {
                    
                    // Возвращаем ID попытки и вопросы (без правильных ответов!)
                    res.json({ 
                        attemptId: attemptId, 
                        questions: questions.map(q => ({...q, options: JSON.parse(q.options)})) 
                    });
                });
            });
        });
    });
});

// 3. Сохранение ответа (Студент)
app.post('/api/exam/answer', authenticateToken, requireRole('student'), (req, res) => {
    const { attemptId, questionId, answer } = req.body;
    // В реальном проекте нужно проверять, принадлежит ли attemptId этому студенту
    db.run('INSERT INTO answers (attempt_id, question_id, student_answer) VALUES (?,?,?)', 
        [attemptId, questionId, answer], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Answer saved" });
    });
});

// 4. Завершение попытки и Автопроверка (Студент)
app.post('/api/exam/submit', authenticateToken, requireRole('student'), (req, res) => {
    const { attemptId } = req.body;

    // Получаем все ответы студента и правильные ответы из базы
    const sql = `
        SELECT a.student_answer, q.correct_answer 
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.attempt_id = ?
    `;

    db.all(sql, [attemptId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let score = 0;
        rows.forEach(row => {
            if (row.student_answer === row.correct_answer) {
                score++;
            }
        });

        // Обновляем попытку: ставим статус завершен и баллы
        db.run('UPDATE attempts SET status = "completed", end_time = CURRENT_TIMESTAMP, score = ? WHERE id = ?', 
            [score, attemptId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Exam submitted", score: score });
        });
    });
});

// 5. Отчет (Преподаватель)
app.get('/api/report/:templateId', authenticateToken, requireRole('teacher'), (req, res) => {
    const sql = `
        SELECT u.username, a.score, a.start_time, a.end_time 
        FROM attempts a
        JOIN users u ON a.student_id = u.id
        WHERE a.template_id = ? AND a.status = 'completed'
    `;
    db.all(sql, [req.params.templateId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ results: rows });
    });
});

// Запуск
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});