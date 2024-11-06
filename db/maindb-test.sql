-- -- (user) groups table data
CREATE TYPE group_type AS ENUM (
    'support',      -- группы поддержки
    'development',  -- группы разработки
    'business',     -- бизнес-группы
    'admin',        -- административные группы
    'security'      -- группы безопасности
);

-- Создаем enum для статуса группы
CREATE TYPE group_status AS ENUM (
    'active',       -- активная группа
    'inactive',     -- неактивная группа
    'archived'      -- архивная группа
);

-- Создаем таблицу groups
CREATE TABLE groups (
    -- Основные идентификаторы
    group_id UUID PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    group_display_name VARCHAR(150),
    
    -- Характеристики группы
    group_type group_type NOT NULL DEFAULT 'business',
    group_status group_status NOT NULL DEFAULT 'active',
    group_description TEXT,
    
    -- Ответственные лица
    group_owner UUID NOT NULL REFERENCES users(user_id),
    group_backup_owner UUID REFERENCES users(user_id),
    
    -- Контактная информация
    group_email VARCHAR(255),
    
    -- Дополнительные параметры
    group_max_members SMALLINT,
    
    -- Метаданные
    group_created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_created_by UUID NOT NULL REFERENCES users(user_id),
    group_modified_at TIMESTAMPTZ,
    group_modified_by UUID REFERENCES users(user_id),
    
    -- Ограничения
    CONSTRAINT unique_group_name UNIQUE (group_name),
    CONSTRAINT check_backup_owner CHECK (group_owner != group_backup_owner)
);

-- Создаем индексы
CREATE INDEX idx_groups_type ON groups(group_type);
CREATE INDEX idx_groups_status ON groups(group_status);
CREATE INDEX idx_groups_owner ON groups(group_owner);


-- -- service related data

CREATE TYPE service_status AS ENUM (
    'drafted',
    'being_developed',
    'being_tested',
    'non_compliant',
    'pending_approval',
    'in_production',
    'under_maintenance',
    'suspended',
    'being_upgraded',
    'discontinued'
);

CREATE TYPE service_priority AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);

CREATE TYPE service_visibility AS ENUM (
    'public',
    'private',
    'restricted'
);

CREATE TYPE service_availability AS ENUM (
    '24x7x365',
    '24x7',
    '24x6',
    '24x5',
    '16x7',
    '16x6',
    '16x5',
    '12x7',
    '12x6',
    '12x5',
    '8x7',
    '8x6',
    '8x5',
    'custom'
);

CREATE TABLE services (
    -- Основные идентификаторы
    service_id UUID PRIMARY KEY,
    service_name VARCHAR(250) NOT NULL,
    service_status service_status NOT NULL DEFAULT 'drafted',
    service_visibility service_visibility NOT NULL DEFAULT 'private',
    service_purpose VARCHAR(250) NOT NULL,
    service_comments VARCHAR(250),
    
    -- Ответственные лица и группы
    service_support_tier1 UUID REFERENCES groups(group_id),
    service_support_tier2 UUID REFERENCES groups(group_id),
    service_support_tier3 UUID REFERENCES groups(group_id),
    service_owner UUID REFERENCES users(user_id),
    service_backup_owner UUID REFERENCES users(user_id),
    service_technical_owner UUID REFERENCES users(user_id),
    service_dispatcher UUID REFERENCES users(user_id),
    
    -- Основные характеристики сервиса
    service_priority service_priority NOT NULL DEFAULT 'low',
    service_availability service_availability NOT NULL DEFAULT '8x5',
    
    -- Технические детали
    service_url VARCHAR(500),
    service_documentation_url VARCHAR(500),
    service_support_instructions TEXT,
    service_recovery_instructions TEXT,
    
    -- Основные даты
    service_created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    service_created_by UUID NOT NULL REFERENCES users(user_id),
    service_modified_at TIMESTAMPTZ,
    service_modified_by UUID REFERENCES users(user_id),
    
    -- UI характеристики
    service_tile_width_closed SMALLINT CHECK (service_tile_width_closed > 0),
    service_tile_height_closed SMALLINT CHECK (service_tile_height_closed > 0),
    service_tile_width_open SMALLINT CHECK (service_tile_width_open > 0),
    service_tile_height_open SMALLINT CHECK (service_tile_height_open > 0),
    service_description_short VARCHAR(250),
    service_description_long TEXT,
    service_icon_path VARCHAR(255) NOT NULL DEFAULT '/public/icons/default_service_icon.png',
    
    -- Ограничения
    CONSTRAINT unique_service_name UNIQUE (service_name)
);

-- Индекс для оптимизации запросов по статусу
CREATE INDEX idx_service_status ON services(service_status);



-----------------------

INSERT INTO service_access_groups (service_id, group_id)
VALUES ('<UUID_сервиса>', '<UUID_группы>');

DELETE FROM service_access_groups
WHERE service_id = '<UUID_сервиса>' AND group_id = '<UUID_группы>';

SELECT s.*
FROM services s
JOIN service_access_groups sag ON s.service_id = sag.service_id
JOIN user_group_members ugm ON sag.group_id = ugm.group_id
WHERE ugm.user_id = '<UUID_пользователя>';

SELECT s.*
FROM services s
JOIN service_access_users sau ON s.service_id = sau.service_id
WHERE sau.user_id = '<UUID_пользователя>';


-- Определение полного набора доступных сервисов для пользователя:

-- Сервисы, доступные через группы
SELECT DISTINCT s.service_id, s.service_name
FROM services s
JOIN service_access_groups sag ON s.service_id = sag.service_id
JOIN user_group_members ugm ON sag.group_id = ugm.group_id
WHERE ugm.user_id = '<UUID_пользователя>'

UNION

-- Сервисы, доступные индивидуально
SELECT s.service_id, s.service_name
FROM services s
JOIN service_access_users sau ON s.service_id = sau.service_id
WHERE sau.user_id = '<UUID_пользователя>'
EXCEPT

-- Исключаем сервисы, доступ к которым запрещен индивидуально
SELECT s.service_id, s.service_name
FROM services s
JOIN service_denied_users sdu ON s.service_id = sdu.service_id
WHERE sdu.user_id = '<UUID_пользователя>'
EXCEPT

-- Исключаем сервисы, доступ к которым запрещен через группы
SELECT s.service_id, s.service_name
FROM services s
JOIN service_denied_groups sdg ON s.service_id = sdg.service_id
JOIN user_group_members ugm ON sdg.group_id = ugm.group_id
WHERE ugm.user_id = '<UUID_пользователя>';

