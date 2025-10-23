-- Таблица ролей
CREATE TABLE IF NOT EXISTS Roles (
    ID_Роли INTEGER PRIMARY KEY AUTOINCREMENT,
    Название_Роли TEXT NOT NULL UNIQUE
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS Users (
    ID_Пользователя INTEGER PRIMARY KEY AUTOINCREMENT,
    Имя TEXT NOT NULL,
    Фамилия TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Пароль_Хэш TEXT NOT NULL,
    ID_Роли INTEGER NOT NULL,
    FOREIGN KEY (ID_Роли) REFERENCES Roles(ID_Роли)
);

-- Таблица банков вопросов
CREATE TABLE IF NOT EXISTS Question_Banks (
    ID_Банка INTEGER PRIMARY KEY AUTOINCREMENT,
    Название TEXT NOT NULL,
    ID_Преподавателя INTEGER NOT NULL,
    FOREIGN KEY (ID_Преподавателя) REFERENCES Users(ID_Пользователя)
);

-- Таблица вопросов
CREATE TABLE IF NOT EXISTS Questions (
    ID_Вопроса INTEGER PRIMARY KEY AUTOINCREMENT,
    Текст_Вопроса TEXT NOT NULL,
    Тип_Вопроса TEXT NOT NULL DEFAULT 'choice',
    Балл_По_Умолчанию INTEGER DEFAULT 1,
    ID_Банка INTEGER NOT NULL,
    FOREIGN KEY (ID_Банка) REFERENCES Question_Banks(ID_Банка)
);

-- Таблица вариантов ответов
CREATE TABLE IF NOT EXISTS Answer_Options (
    ID_Варианта INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Вопроса INTEGER NOT NULL,
    Текст_Варианта TEXT NOT NULL,
    Это_Правильный BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ID_Вопроса) REFERENCES Questions(ID_Вопроса)
);

-- Таблица шаблонов экзаменов
CREATE TABLE IF NOT EXISTS Exam_Templates (
    ID_Шаблона INTEGER PRIMARY KEY AUTOINCREMENT,
    Название TEXT NOT NULL,
    Длительность_мин INTEGER NOT NULL,
    Дата_Создания DATETIME DEFAULT CURRENT_TIMESTAMP,
    ID_Преподавателя INTEGER NOT NULL,
    FOREIGN KEY (ID_Преподавателя) REFERENCES Users(ID_Пользователя)
);

-- Таблица связи шаблонов и банков
CREATE TABLE IF NOT EXISTS Template_Banks (
    ID_Шаблона INTEGER NOT NULL,
    ID_Банка INTEGER NOT NULL,
    Количество_Вопросов INTEGER NOT NULL,
    PRIMARY KEY (ID_Шаблона, ID_Банка),
    FOREIGN KEY (ID_Шаблона) REFERENCES Exam_Templates(ID_Шаблона),
    FOREIGN KEY (ID_Банка) REFERENCES Question_Banks(ID_Банка)
);

-- Таблица допусков
CREATE TABLE IF NOT EXISTS Exam_Permissions (
    ID_Допуска INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Студента INTEGER NOT NULL,
    ID_Шаблона INTEGER NOT NULL,
    Дата_Начала_Допуска DATETIME NOT NULL,
    Дата_Окончания_Допуска DATETIME NOT NULL,
    Статус_Допуска TEXT DEFAULT 'active',
    FOREIGN KEY (ID_Студента) REFERENCES Users(ID_Пользователя),
    FOREIGN KEY (ID_Шаблона) REFERENCES Exam_Templates(ID_Шаблона)
);

-- Таблица попыток
CREATE TABLE IF NOT EXISTS Exam_Attempts (
    ID_Попытки INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Допуска INTEGER NOT NULL,
    Время_Старта DATETIME DEFAULT CURRENT_TIMESTAMP,
    Время_Окончания_Факт DATETIME,
    Время_Окончания_План DATETIME NOT NULL,
    Итоговый_Балл REAL DEFAULT 0,
    Статус TEXT DEFAULT 'active',
    FOREIGN KEY (ID_Допуска) REFERENCES Exam_Permissions(ID_Допуска)
);

-- Таблица вопросов попытки
CREATE TABLE IF NOT EXISTS Attempt_Questions (
    ID_Попытки INTEGER NOT NULL,
    ID_Вопроса INTEGER NOT NULL,
    Копия_Текста_Вопроса TEXT NOT NULL,
    Балл_За_Вопрос REAL NOT NULL,
    PRIMARY KEY (ID_Попытки, ID_Вопроса),
    FOREIGN KEY (ID_Попытки) REFERENCES Exam_Attempts(ID_Попытки),
    FOREIGN KEY (ID_Вопроса) REFERENCES Questions(ID_Вопроса)
);

-- Таблица ответов студентов
CREATE TABLE IF NOT EXISTS Student_Answers (
    ID_Ответа INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Попытки INTEGER NOT NULL,
    ID_Вопроса INTEGER NOT NULL,
    Выбранный_Вариант_ID INTEGER,
    Текст_Ответа TEXT,
    Полученный_Балл REAL DEFAULT 0,
    FOREIGN KEY (ID_Попытки) REFERENCES Exam_Attempts(ID_Попытки),
    FOREIGN KEY (ID_Вопроса) REFERENCES Questions(ID_Вопроса),
    FOREIGN KEY (Выбранный_Вариант_ID) REFERENCES Answer_Options(ID_Варианта)
);

-- Таблица журнала действий
CREATE TABLE IF NOT EXISTS Activity_Log (
    ID_Записи INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Пользователя INTEGER NOT NULL,
    Время_Действия DATETIME DEFAULT CURRENT_TIMESTAMP,
    Тип_Действия TEXT NOT NULL,
    Описание TEXT,
    FOREIGN KEY (ID_Пользователя) REFERENCES Users(ID_Пользователя)
);