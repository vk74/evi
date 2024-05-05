const express = require('express');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Импорт функции для генерации UUID
const { registerNewUser, validateUser, changeUserPassword } = require('./db/userdb'); // Импорт функции registerNewUser

//импорт маршрутов


// импорт middleware
const authenticateToken = require('./middleware/issueToken');
const authorizeRegisteredUser = require('./guards/authorizeRegisteredUser');

const { insertData, getLocations } = require('./db/database');
const port = 3000;
const app = express();
const fs = require('fs');

app.use(express.json());

const privateKeyPath = './keys/private_key.pem'; // Путь к файлу приватного ключа
// const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // Чтение приватного ключа из файла

// Считывание приватного ключа с логированием
let privateKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  console.log('Считывание ключа: Успешно');
} catch (error) {
  console.error('Считывание ключа: Ошибка -', error.message);
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// app.use(cors());
app.use(cors({
  origin: 'http://localhost:8080' // Разрешить доступ только для этого источника
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Backend server is running');
});


////////////////////////// незащищенные маршруты (без использования guards) для регистрации и логина пользователя ////////////////////////// 

// маршрут для аутентификации пользователя
app.post('/login', async (req, res) => {
  console.log('Получен запрос аутентификации:', req.body); // Логирование запроса

  try {
    const { username, password } = req.body;
    const isValid = await validateUser(req.body);
    console.log('Результат валидации:', isValid); // Логирование результата валидации

    if (isValid) {
      // создание payload для JWT
      const payload = {
        iss: 'ev2 webapp',       // издатель токена
        sub: username,              // тема токена (subject), кому он выдается
        aud: 'ev2 webapp registered users', // аудитория токена
        // время истечения жизни токена и время выдачи (exp и iat) добавляются во время подписания токена
        jti: uuidv4(),              // уникальный идентификатор токена
      };
      // генерация JWT и подписание приватным ключем
      try {
        const token = jwt.sign(payload, privateKey, {
          algorithm: 'RS256',
          expiresIn: '2h'
        });
        console.log('jwt успешно создан и выдан пользователю');

        // отправка токена обратно клиенту
        res.json({ success: true, token });
      } catch (tokenError) {
        console.error('Создание токена: Ошибка -', tokenError.message);
        res.status(500).send('Ошибка при создании токена');
      }

    } else {
      res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Ошибка при аутентификации пользователя:', error.message);
    res.status(500).send('Ошибка сервера при аутентификации пользователя');
  }
});

// маршрут для регистрации пользователя
app.post('/register', async (req, res) => {
  try {
    const user = await registerNewUser(req.body); // используем функцию registerNewUser в модуле базы данных
    res.status(201).json({ user });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error.message);
    res.status(500).send('Ошибка сервера при регистрации пользователя');
  }
});

////////////////////////// защищенные маршруты (router guards) для основной функциональности приложения ////////////////////////// 

// маршрут для смены пароля пользователя
app.post('/changeuserpass', async (req, res) => {
  try {
    // changeUserPassword в модуле userdb принимает объект с userID и newPassword и возвращает результат операции
    const result = await changeUserPassword(req.body); // req.body должен содержать userID и newPassword
    if (result.success) {
      res.status(200).json({ message: 'Пароль успешно изменен.' });
    } else {
      // В случае, если пользователь не найден или другая ошибка
      res.status(404).json({ error: 'Пользователь не найден или ошибка при смене пароля.' });
    }
  } catch (error) {
    console.error('Ошибка при смене пароля пользователя:', error.message);
    res.status(500).send('Ошибка сервера при смене пароля пользователя');
  }
});




////////////////////////// прототипы маршрутов для работы с excel ////////////////////////// 

// маршрут для получения списка локаций
app.get('/protolocations', async (req, res) => {
  try {
    const locations = await getLocations();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//маршрут для записи данных прототипа формы в таблицу в БД postgres
app.post('/protosubmit', async (req, res) => {
  try {
    console.log('Полученный запрос:', req.body); // строка для отладки
    const { orgname, region, location, checkbox, radioOption, date } = req.body;
    const result = await insertData(orgname, region, location, checkbox, radioOption, date);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// маршрут для генерации Excel файла в выбранную пользователем директорию

app.post('/proto-generate-excel', async (req, res) => {
  try {
    const formData = req.body; // Данные из запроса
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Sheet');

    // запись заголовков
    worksheet.columns = [
      { header: 'Поле', key: 'field', width: 30 },
      { header: 'Значение', key: 'value', width: 30 }
    ];

    // добавление данных в строки
    worksheet.addRow({ field: 'Название организации', value: formData.orgname });
    worksheet.addRow({ field: 'Страна / Регион', value: formData.region });
    worksheet.addRow({ field: 'Локация', value: formData.location });
    worksheet.addRow({ field: 'Станция мониторинга развернута', value: formData.checkbox ? 'Да' : 'Нет' });
    worksheet.addRow({ field: 'Выбранная опция', value: formData.radio });
    worksheet.addRow({ field: 'Дата заполнения', value: formData.date });

    // вместо записи файла на сервере, отправляем его клиенту
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=estimatorFile.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Ошибка при генерации файла Excel:', error);
    res.status(500).send('Ошибка при генерации файла Excel');
  }
});


/*  вариант с сохранением файла напрямую, в файловую систему на сервере backend

app.post('/proto-generate-excel', async (req, res) => {
  try {
    const formData = req.body; // Данные из запроса
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Sheet');

    // Запись заголовков
    worksheet.columns = [
      { header: 'Поле', key: 'field', width: 30 },
      { header: 'Значение', key: 'value', width: 30 }
    ];

    // Добавление данных в файл
    worksheet.addRow({ field: 'Название организации', value: formData.orgname });
    worksheet.addRow({ field: 'Страна / Регион', value: formData.region });
    worksheet.addRow({ field: 'Локация', value: formData.location });
    worksheet.addRow({ field: 'Станция мониторинга развернута', value: formData.checkbox ? 'Да' : 'Нет' });
    worksheet.addRow({ field: 'Выбранная опция', value: formData.radio });
    worksheet.addRow({ field: 'Дата заполнения', value: formData.date });

    const filePath = '/Users/vit/Documents/code/output/estimatorFile1.xlsx'; // Путь для сохранения файла
    await workbook.xlsx.writeFile(filePath);

    res.status(200).send('Файл Excel успешно сгенерирован');
  } catch (error) {
    console.error('Ошибка при генерации файла Excel:', error);
    res.status(500).send('Ошибка при генерации файла Excel');
  }
});
*/

////////////////////////// конец прототипов маршрутов для excel ////////////////////////// 