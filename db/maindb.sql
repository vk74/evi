-- service related data

-- work items related data

-- user related data


CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    family_name
    given_name
    middle_name
    gender
    display_name
    account_active_from
    email VARCHAR(100) NOT NULL
    email_status
    phone
    phone_status
    user_description
    user_address
    hashed_password
    password_last_set
    organization_id
    organization_position
    organization_department
    organization_manager
    account_starts
    account_expires
    last_logon_timestamp
    lockout_timestamp
    account_created_at
    account_updated_at

    userpreferences
);

CREATE TABLE user_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(50) NOT NULL
);

CREATE TABLE user_membership (
    user_id INT,
    group_id INT,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES user_groups(group_id) ON DELETE CASCADE
);



-- regional data


-- pricelist and labor cost data


/*
description:
the script creates a fresh postgres database named main.db for work with ev2 backend app.

version: 0.1

date:

authors:
*/