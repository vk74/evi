// services.editor.validator.js
// Модуль валидации данных для сервисов
// Проверяет корректность входящих данных перед записью в базу данных
// Выполняет проверку полей согласно их типу и правилам валидации
// Поддерживает поэтапное заполнение данных и расширение типов данных

const { pool } = require('../db/maindb');

// Класс для ошибок валидации
class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// Конфигурация правил валидации для полей
const FIELD_RULES = {
    // Текущие поля
    name: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 250,
        fieldName: 'Название сервиса'
    },
    shortDescription: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 250,
        fieldName: 'Краткое описание'
    },
    purpose: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 250,
        fieldName: 'Назначение'
    },
    fullDescription: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 10000,
        fieldName: 'Подробное описание'
    },
    comments: {
        type: 'string',
        required: false,
        minLength: 3,
        maxLength: 250,
        fieldName: 'Комментарии'
    },
    visibility: {
        type: 'enum',
        required: false,
        enumType: 'service_visibility',
        fieldName: 'Видимость'
    },
    status: {
        type: 'enum',
        required: false,
        enumType: 'service_status',
        fieldName: 'Статус'
    },
    priority: {
        type: 'enum',
        required: false,
        enumType: 'service_priority',
        fieldName: 'Приоритет'
    }
};

// Регулярные выражения для проверки различных типов данных
const VALIDATION_PATTERNS = {
    // Паттерн для проверки запрещенных символов и HTML
    forbiddenChars: /<[^>]*>|[<>"'&]/,
};

/**
 * Проверяет поле данных в зависимости от его типа и правил
 * @param {any} value - проверяемое значение
 * @param {Object} rules - правила валидации для поля
 * @throws {ValidationError} если проверка не пройдена
 */
const validateDataField = (value, rules) => {
    console.log(`\nПроверка поля ${rules.fieldName}:`);
    console.log(`- Значение: "${value}"`);
    console.log(`- Тип данных: ${rules.type}`);

    // Проверка на undefined или null
    if (value === undefined || value === null) {
        console.log('- Результат: пропущено (пустое значение)');
        return;
    }

    // Проверка типа string
    if (rules.type === 'string') {
        // Проверка типа данных
        if (typeof value !== 'string') {
            console.log(`- Ошибка: неверный тип данных (${typeof value})`);
            throw new ValidationError(
                `Поле ${rules.fieldName} должно быть текстом`,
                rules.fieldName
            );
        }

        // Пропускаем проверку длины если поле пустое и не обязательное
        if (value.trim() === '' && !rules.required) {
            console.log('- Результат: пропущено (пустая строка)');
            return;
        }

        // Проверка длины
        console.log(`- Проверка длины: ${value.length} символов (допустимо от ${rules.minLength} до ${rules.maxLength})`);
        if (value.length < rules.minLength || value.length > rules.maxLength) {
            console.log('- Ошибка: некорректная длина');
            throw new ValidationError(
                `Поле ${rules.fieldName} должно содержать от ${rules.minLength} до ${rules.maxLength} символов`,
                rules.fieldName
            );
        }

        // Проверка на запрещенные символы
        if (VALIDATION_PATTERNS.forbiddenChars.test(value)) {
            console.log('- Ошибка: обнаружены запрещенные символы');
            throw new ValidationError(
                `Поле ${rules.fieldName} содержит запрещенные символы или HTML-теги`,
                rules.fieldName
            );
        }

        console.log('- Результат: успешно');
    }
}

/**
 * Проверяет значение на соответствие enum-типу в базе данных
 * @param {string} enumType - название типа в базе данных
 * @param {string} value - проверяемое значение
 * @param {string} fieldName - название поля для сообщения об ошибке
 * @throws {ValidationError} если значение не соответствует enum-типу
 */
const validateEnumValue = async (enumType, value, fieldName) => {
    console.log(`\nПроверка enum-поля ${fieldName}:`);
    console.log(`- Значение: "${value}"`);
    console.log(`- Тип enum: ${enumType}`);

    // Пропускаем проверку если значение не предоставлено
    if (value === undefined || value === null) {
        console.log('- Результат: пропущено (пустое значение)');
        return;
    }

    try {
        const query = `
            SELECT unnest(enum_range(NULL::app.${enumType})) as value;
        `;
        const result = await pool.query(query);
        const validValues = result.rows.map(row => row.value);

        console.log(`- Допустимые значения: ${validValues.join(', ')}`);

        if (!validValues.includes(value)) {
            console.log('- Ошибка: значение не найдено в списке допустимых');
            throw new ValidationError(
                `Поле ${fieldName} содержит недопустимое значение. Допустимые значения: ${validValues.join(', ')}`,
                fieldName
            );
        }

        console.log('- Результат: успешно');
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        console.log(`- Ошибка: ${error.message}`);
        throw new ValidationError(
            `Ошибка при проверке поля ${fieldName}: ${error.message}`,
            fieldName
        );
    }
}

/**
 * Основная функция валидации данных сервиса
 * @param {Object} data - объект с данными для валидации
 * @throws {ValidationError} если проверка не пройдена
 */
const validateServiceData = async (data) => {
    console.log('\n=== Начало валидации данных сервиса ===');
    console.log('Входящие данные:', data);
    
    // Проходим только по тем полям, которые пришли в запросе
    for (const [fieldKey, value] of Object.entries(data)) {
        // Проверяем, что для поля существуют правила валидации
        if (FIELD_RULES[fieldKey]) {
            const rules = FIELD_RULES[fieldKey];
            if (rules.type === 'enum') {
                await validateEnumValue(rules.enumType, value, rules.fieldName);
            } else {
                validateDataField(value, rules);
            }
        } else {
            console.log(`\nПоле ${fieldKey} пропущено (нет правил валидации)`);
        }
    }
    
    console.log('\n=== Валидация успешно завершена ===');
}

module.exports = {
    validateServiceData,
    ValidationError,
    FIELD_RULES
};