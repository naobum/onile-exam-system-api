<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const db = require('../database/init');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  // Получаем статистику для дашборда
  db.get(
    `SELECT COUNT(*) as banks_count FROM Question_Banks WHERE ID_Преподавателя = ?`,
    [req.session.user.ID_Пользователя],
    (err, banksResult) => {
      if (err) {
        console.error(err);
        return renderWithDefaults(res);
      }

      db.get(
        `SELECT COUNT(*) as exams_count FROM Exam_Templates WHERE ID_Преподавателя = ?`,
        [req.session.user.ID_Пользователя],
        (err, examsResult) => {
          if (err) {
            console.error(err);
            return renderWithDefaults(res, banksResult.banks_count);
          }

          db.get(
            `SELECT COUNT(*) as students_count FROM Users WHERE ID_Роли = (SELECT ID_Роли FROM Roles WHERE Название_Роли = 'Студент')`,
            (err, studentsResult) => {
              if (err) {
                console.error(err);
                return renderWithDefaults(res, banksResult.banks_count, examsResult.exams_count);
              }

              res.render('index', { 
                title: 'Главная',
                banksCount: banksResult.banks_count,
                examsCount: examsResult.exams_count,
                studentsCount: studentsResult.students_count
              });
            }
          );
        }
      );
    }
  );
});

function renderWithDefaults(res, banksCount = 0, examsCount = 0, studentsCount = 0) {
  res.render('index', { 
    title: 'Главная',
    banksCount: banksCount,
    examsCount: examsCount,
    studentsCount: studentsCount
  });
}

module.exports = router;
=======
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
>>>>>>> upstream/master
