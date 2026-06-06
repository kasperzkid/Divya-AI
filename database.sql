-- PostgreSQL Schema for Supabase (health_ai schema matching backend queries)

-- Create the custom schema to match the hardcoded prefixes in backend queries
CREATE SCHEMA IF NOT EXISTS health_ai;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS health_ai.users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    picture TEXT,
    age INTEGER,
    weight REAL,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. OTPs Table (Temporary OTP verification keys)
CREATE TABLE IF NOT EXISTS health_ai.otps (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 3. Sessions Table (Chat & Report sessions)
CREATE TABLE IF NOT EXISTS health_ai.sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES health_ai.users(id) ON DELETE CASCADE
);

-- 4. Messages Table (Chat dialogue logs)
CREATE TABLE IF NOT EXISTS health_ai.messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'ai', 'system')),
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_session FOREIGN KEY (session_id) REFERENCES health_ai.sessions(id) ON DELETE CASCADE
);

-- 5. Alarms Table (Medication, meals & supplement alarms)
CREATE TABLE IF NOT EXISTS health_ai.alarms (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    time VARCHAR(255) NOT NULL,
    days VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alarms_user FOREIGN KEY (user_id) REFERENCES health_ai.users(id) ON DELETE CASCADE
);

-- 6. Custom Tasks Table (Daily recovery plan tasks)
CREATE TABLE IF NOT EXISTS health_ai.custom_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    time VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_custom_tasks_user FOREIGN KEY (user_id) REFERENCES health_ai.users(id) ON DELETE CASCADE
);
