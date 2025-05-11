/**
 * services.editor.validator.ts - version 1.0.2
 * BACKEND validator module for service data
 * 
 * This file is a candidate for deletion after re-creation of services module
 * 
 * Validates incoming service data before storing in database
 * Checks fields according to their type and validation rules
 * Supports incremental data filling and extensible data types
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';

// Type assertion for pool
const pool = pgPool as Pool;

// Class for validation errors
export class ValidationError extends Error {
    field: string | null;
    
    constructor(message: string, field: string | null = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// Field rule type definitions
interface StringRule {
    type: 'string';
    required: boolean;
    minLength: number;
    maxLength: number;
    fieldName: string;
}

interface EnumRule {
    type: 'enum';
    required: boolean;
    enumType: string;
    fieldName: string;
}

type FieldRule = StringRule | EnumRule;

// Configuration of validation rules for fields
export const FIELD_RULES: Record<string, FieldRule> = {
    // Current fields
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

// Regular expressions for checking various data types
const VALIDATION_PATTERNS = {
    // Pattern for checking forbidden characters and HTML
    forbiddenChars: /<[^>]*>|[<>"'&]/,
};

/**
 * Checks a data field depending on its type and rules
 * @param value - value to check
 * @param rules - validation rules for the field
 * @throws ValidationError if validation fails
 */
const validateDataField = (value: any, rules: FieldRule): void => {
    console.log(`\nПроверка поля ${rules.fieldName}:`);
    console.log(`- Значение: "${value}"`);
    console.log(`- Тип данных: ${rules.type}`);

    // Check for undefined or null
    if (value === undefined || value === null) {
        console.log('- Результат: пропущено (пустое значение)');
        return;
    }

    // Check for string type
    if (rules.type === 'string') {
        // Check data type
        if (typeof value !== 'string') {
            console.log(`- Ошибка: неверный тип данных (${typeof value})`);
            throw new ValidationError(
                `Поле ${rules.fieldName} должно быть текстом`,
                rules.fieldName
            );
        }

        // Skip length check if field is empty and not required
        if (value.trim() === '' && !rules.required) {
            console.log('- Результат: пропущено (пустая строка)');
            return;
        }

        // Check length
        console.log(`- Проверка длины: ${value.length} символов (допустимо от ${rules.minLength} до ${rules.maxLength})`);
        if (value.length < rules.minLength || value.length > rules.maxLength) {
            console.log('- Ошибка: некорректная длина');
            throw new ValidationError(
                `Поле ${rules.fieldName} должно содержать от ${rules.minLength} до ${rules.maxLength} символов`,
                rules.fieldName
            );
        }

        // Check for forbidden characters
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
 * Validates a value against an enum type in the database
 * @param enumType - name of the type in the database
 * @param value - value to check
 * @param fieldName - field name for error message
 * @throws ValidationError if value doesn't match enum type
 */
const validateEnumValue = async (enumType: string, value: any, fieldName: string): Promise<void> => {
    console.log(`\nПроверка enum-поля ${fieldName}:`);
    console.log(`- Значение: "${value}"`);
    console.log(`- Тип enum: ${enumType}`);

    // Skip check if value is not provided
    if (value === undefined || value === null) {
        console.log('- Результат: пропущено (пустое значение)');
        return;
    }

    try {
        const query = `
            SELECT unnest(enum_range(NULL::app.${enumType})) as value;
        `;
        const result: QueryResult<{ value: string }> = await pool.query(query);
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
        console.log(`- Ошибка: ${(error as Error).message}`);
        throw new ValidationError(
            `Ошибка при проверке поля ${fieldName}: ${(error as Error).message}`,
            fieldName
        );
    }
}

/**
 * Main service data validation function
 * @param data - object with data to validate
 * @throws ValidationError if validation fails
 */
export const validateServiceData = async (data: Record<string, any>): Promise<void> => {
    console.log('\n=== Начало валидации данных сервиса ===');
    console.log('Входящие данные:', data);
    
    // Process only those fields that come in the request
    for (const [fieldKey, value] of Object.entries(data)) {
        // Check if there are validation rules for the field
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