-- Brain Arcade schema. Safe to re-run: drops and recreates the database.
DROP DATABASE IF EXISTS brain_arcade;
CREATE DATABASE brain_arcade CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE brain_arcade;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    birthday DATE NOT NULL,
    gender ENUM('female', 'male', 'non_binary', 'other', 'prefer_not_to_say') NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
);
