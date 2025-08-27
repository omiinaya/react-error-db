-- Create additional databases for testing if needed
CREATE DATABASE errdb_test;

-- Create additional users if needed
-- CREATE USER test_user WITH PASSWORD 'test_password';
-- GRANT ALL PRIVILEGES ON DATABASE errdb_test TO test_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";