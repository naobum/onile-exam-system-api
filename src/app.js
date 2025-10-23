var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
<<<<<<< HEAD
var session = require('express-session');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var banksRouter = require('./routes/banks');
var questionsRouter = require('./routes/questions');
var examsRouter = require('./routes/exams');
var attemptsRouter = require('./routes/attempts');
var studentsRouter = require('./routes/students');
=======

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
>>>>>>> upstream/master

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
<<<<<<< HEAD
app.set('view engine', 'pug');
=======
app.set('view engine', 'jade');
>>>>>>> upstream/master

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
<<<<<<< HEAD
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'exam-system-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware для передачи user в шаблоны
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/banks', banksRouter);
app.use('/questions', questionsRouter);
app.use('/exams', examsRouter);
app.use('/attempts', attemptsRouter);
app.use('/students', studentsRouter);
=======

app.use('/', indexRouter);
app.use('/users', usersRouter);
>>>>>>> upstream/master

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

<<<<<<< HEAD
module.exports = app;
=======
module.exports = app;
>>>>>>> upstream/master
