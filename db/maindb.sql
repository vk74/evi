-- -- service related data
CREATE TYPE service_status AS ENUM {
    'draft',
    'production',
    'discontinued'
}

create table service {
    service_id SERIAL NOT NULL,
    entity_id UUID,
    service_name varchar (250) NOT NULL,
    service_status service_status,
    purpose varchar(250) NOT NULL,
    comments varchar(250) NOT NULL,    
    created_at timestamp,
    last_modified_at timestamp

    support_group VARCHAR(50) NOT NULL,

}

-- ------- work items related data


-- template related data

CREATE TYPE template_status AS ENUM {
    'draft',
    'production',
    'discontinued'
}

create table template {
    template_id SERIAL NOT NULL,
    entity_id UUID,
    related_service UUID,
    template_status template_status,
    template_name varchar(250) NOT NULL,
    purpose varchar(250) NOT NULL,
    comments varchar(250) NOT NULL,

    -- template_configuration
    -- template_references
    -- template_implementation

    title VARCHAR(100) NOT NULL,
    display_name varchar(100) NULL,  -- still don't understand why this field is needed

    -- service ownership
    service_owner UUID,
    default_service_group UUID,


    -- service log

    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_date TIMESTAMP,
    created_by UUID,

    set_draft_status_by UUID,
    set_draft_status TIMESTAMP,
    set_production_status_by UUID,
    set_production_status TIMESTAMP
    set_discontinued_status_by UUID,
    set_discontinued_status TIMESTAMP
}

-- -- service requests

-- CREATE TYPE sr_priority AS ENUM (
-- priority is a calculated property, it should NOT be stored in the DB. 
--priority attribute is also optional for service requests and may be implemented later
-- )

-- CREATE TYPE sr_urgency AS ENUM (
-- urgency attribute may be implemented later as it is not mandatory for Service Requests Fulfillment process
-- )

CREATE TYPE sr_status AS ENUM (
    'new',
    'assigned',
    'in progress',
    'pending',
    'on hold',
    'resolved',
    'closed',
    'cancelled',
    'awaiting approval',
    'approved',
    'rejected',
    'escalated'
);

CREATE TABLE sr (
    -- entity system columns
    sr_id SERIAL PRIMARY KEY, -- simple auto-incrementing integer without -sr- prefix
    entity_uuid UUID NOT NULL,
    isTemplate boolean NOT NULL DEFAULT false,
    created_from_template_id UUID,
    isParent boolean NOT NULL DEFAULT false,

    rsrv1
    rsrv2
    rsrv3
    rsrv4
    rsrv5
    rsrv6
    rsrv7
    rsrv8

    -- general columns about entity  
    -- attachment  -- attachments feature should be released later as a separate table. if you keep attachments as a column in the same table, select requests might become really slow due to they read the whole table first.
    source -- whew the SR was opened from: manual, e-mail, user call etc.
    title VARCHAR(100) NOT NULL,
    display_name varchar(100) NULL,  -- still don't understand why this field is needed
        --area  instead of traditional "area" I use category field
    category
    sub-category
    notes varchar(4000) NULL,   -- user input at SR creation time
    assigned_support_group VARCHAR(50) NOT NULL,
    support_group_set_by UUID,
    assigned_to_specialist UUID,

    status sr_status NOT NULL,
    priority int,
    IsDowntime boolean DEFAULT false,
    user_preferred_contact_method VARCHAR(100),

    rsrv11
    rsrv12
    rsrv13
    rsrv14
    rsrv15
    rsrv16
    rsrv17
    rsrv18

    rsrv21
    rsrv22
    rsrv23
    rsrv24
    rsrv25
    rsrv26
    rsrv27
    rsrv28

    -- entity lifecycle 

    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    first_assigne_date TIMESTAMP,
    first_assigned_by UUID,
    first_response_date TIMESTAMP,
    set_in_progress_date TIMESTAMP,
    set_in_progress_by UUID,
    set_pending_date TIMESTAMP,
    set_pending_by UUID,
    set_on_hold_date TIMESTAMP,
    set_on_hold_by UUID,
    set_active_date TIMESTAMP,
    set_active_by UUID,
    set_on_hold_date TIMESTAMP,
    set_on_hold_by UUID,
    set_complete_date TIMESTAMP,
    set_complete_by UUID,
    set_closed_date TIMESTAMP,
    set_closed_by UUID,
    set_cancelled_date TIMESTAMP,
    set_cancelled_by UUID,
    set_returned_date TIMESTAMP,
    set_returned_by UUID,
    set_awaiting_approval_date TIMESTAMP,
    set_awaiting_approval_by UUID,
    set_approved_date TIMESTAMP,
    set_approved_by UUID,
    set_rejected_date TIMESTAMP,
    set_rejected_by UUID,
    set_escalated_date TIESTAMP,
    set_escalated_by UUID,

    --template lifecycle 
    template_status template_status,

    -- entity schedule and cost
    planned_work
	scheduled_start_date
    scheduled_end_date
    scheduled_downtime_start_date
	scheduled_downtime_enddate
    planned_cost

    actual_start_date
    actual_end_date
    actual_downtime_start_date
	actual_downtime_end_date
    actual_cost
    actual_work
    end_result

    -- entity relations
    related_service UUID,
    -- related_irs -- relations via external table
    -- related_prs
    -- related_crs
    -- related_rrs
    -- related_srs
    -- related_activities
    -- related_SLA

    -- entity user communication log


    -- entity admin communication log


    -- entity activity log

    -- entity feedback
    sr_user_feedback_rating INTEGER CHECK (value >= 1 AND value <= 10),
    sr_user_feedback_comments VARCHAR(4000),
    sr_user_feedback_date timestamp
);

-- -- incident records

-- -- problem records

-- -- change requests

-- -- release requests

-- ------- activities
-- -- manual activity

-- -- review activity

-- -- parallel activity

-- -- sequential activity

-- -- scripted activity

-- -- user communications

CREATE TABLE Conversations (
    user_comm_id UUID PRIMARY KEY,
    entity_id UUID NOT NULL,    -- will be filled with sr_uuid, ir_uuid or others during record addition to the table
    sender_id UUID,
    message varchar(4000) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX (record_id)
);


CREATE TABLE manual_activity {
    activity_id
    entity_id [uniqueidentifier] NOT NULL,
    activity_business_trip_required
};

CREATE TABLE review_activity {

};

    


-- ------- user related data

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_uuid NOT NULL,
    username VARCHAR(50) NOT NULL,
    family_name VARCHAR(50) NOT NULL,
    given_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50) NOT NULL,
    gender
    display_name VARCHAR(50) NOT NULL,
    account_active_from
    email VARCHAR(100) NOT NULL
    email_status ENUM('unconfirmed', 'confirmed') NOT NULL,
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
    user_id UUID,
    group_id UUID,
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