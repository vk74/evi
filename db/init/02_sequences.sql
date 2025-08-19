-- Version: 1.0
-- Description: Create sequences
-- Backend file: init_sequences

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS app.tokens_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

-- Set ownership (will be set after table creation in 03_tables.sql)
-- ALTER SEQUENCE app.tokens_id_seq OWNED BY app.tokens.id;
