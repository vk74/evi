const fs = require('fs');
const path = require('path');

const filePath = "/Users/vk/Library/Mobile Documents/com~apple~CloudDocs/code/ev2/front/src/components/admin/users/UsersListProto/protoUsersList.vue";

try {
  // Читаем содержимое файла
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Обновляем версию файла
  content = content.replace(
    /Version: 1.0.01/g,
    'Version: 1.0.02'
  );
  
  // 2. Обновляем описание в комментарии
  content = content.replace(
    /- Боковая панель для размещения элементов управления \(разделение на общие и относящиеся к выбранному элементу\)/g,
    '- Боковая панель для размещения элементов управления (динамическое разделение на общие и относящиеся к выбранному элементу)'
  );
  
  // 3. Удаляем колонку middleName из определения таблицы
  content = content.replace(
    /  \{\s*\n\s*title: t\('list\.table\.headers\.firstName'\),\s*\n\s*key: 'first_name',\s*\n\s*sortable: true\s*\n\s*\},\s*\n\s*\{\s*\n\s*title: t\('list\.table\.headers\.middleName'\),\s*\n\s*key: 'middle_name',\s*\n\s*sortable: true\s*\n\s*\}/g,
    '  { \n    title: t(\'list.table.headers.firstName\'), \n    key: \'first_name\',\n    sortable: true\n  }'
  );
  
  // 4. Заменяем структуру sidebar на динамическое разделение
  content = content.replace(
    /<div class="side-bar-container">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g,
    `<div class="side-bar-container">
        <!-- Верхняя часть боковой панели - кнопки для операций над компонентом -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            Управление списком
          </h3>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="createUser"
          >
            {{ t('list.buttons.create') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :loading="loading"
            @click="refreshList"
          >
            <v-icon icon="mdi-refresh" class="mr-2" />
            {{ t('list.buttons.refresh') }}
          </v-btn>
        </div>
        
        <!-- Разделитель между секциями -->
        <div class="sidebar-divider"></div>
        
        <!-- Нижняя часть боковой панели - кнопки для операций над выбранными элементами -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            Управление элементом
          </h3>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editUser"
          >
            {{ t('list.buttons.edit') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="resetPassword"
          >
            {{ t('list.buttons.resetPassword') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="onDeleteSelected"
          >
            {{ t('list.buttons.delete') }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>`
  );
  
  // 5. Обновляем стили для боковой панели
  content = content.replace(
    /\/\* Стили для боковой панели \*\/\s*\.side-bar-container \{\s*width: 15%;[\s\S]*?min-height: 60%;\s*\}/g,
    `/* Стили для боковой панели */
.side-bar-container {
  width: 18%; /* Увеличено с 15% до 18% от ширины родительского элемента */
  min-width: 220px; /* Увеличено с 180px до 220px для лучшего отображения кнопок */
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}

/* Разделитель между секциями */
.sidebar-divider {
  height: 20px; /* Фиксированная высота разделителя */
  position: relative;
  margin: 0 16px;
}

.sidebar-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}`
  );
  
  // Записываем обновленное содержимое обратно в файл
  fs.writeFileSync(filePath, content);
  console.log('Файл успешно обновлен!');
} catch (err) {
  console.error('Произошла ошибка:', err);
}
