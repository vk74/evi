const express = require('express');
const userRoutes = require('./routes/routes.users'); 
const servicesRoutes = require('./routes/routes.services'); 
const catalogRoutes = require('./routes/routes.catalog');


const ExcelJS = require('exceljs');
const bodyParser = require('body-parser');
const cors = require('cors');

const { insertData, getLocations } = require('./db/database');
const port = 3000;
const app = express();
const fs = require('fs');

const privateKeyPath = './keys/private_key.pem'; // path to private key used to sign new JWT
const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // read private key from file
global.privateKey = privateKey;

/* app.listen(port, () => {
  //const timestamp = new Date().toISOString(); // Получаем текущую временную метку в формате ISO
  const timestamp = new Date().toLocaleString(); // Получаем текущую временную метку в локальном часовом поясе
  console.log(`[${timestamp}] Server listening at http://localhost:${port}`);
}); */

app.listen(port, () => {
  const now = new Date();
  const dateOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  const timeOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false // Использование 24-часового формата
  };

  // Форматируем дату в формате день/месяц/год
  const formattedDate = now.toLocaleDateString('en-GB', dateOptions);
  const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
  
  // Объединяем дату и время
  const timestamp = `${formattedDate}, ${formattedTime}`;

  console.log(`[${timestamp}] Server listening at http://localhost:${port}`);
});

//app.use(cors());
app.use(cors({
  origin: 'http://localhost:8080' // Разрешить доступ только для этого источника
}));

app.use(express.json());
//app.use('/profile', getUserProfile); // Регистрация маршрута
app.use(bodyParser.json());
app.use(userRoutes);
app.use(servicesRoutes);
app.use(catalogRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running');
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