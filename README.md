# The Anime Database

Welcome to The Anime Database, a project that provides a platform for anime enthusiasts to explore, review, and manage their anime lists. This project is built using Node.js, Express.js, PostgreSQL, and EJS templating. It utilizes the Jikan v4 API to fetch anime details by scraping My Anime List website.

## Getting Started

Follow these steps to set up the project locally:

### Fork the Repository

1. Click on the "Fork" button at the top right of this repository to create your own copy.

### Clone the Repository

2. Clone your forked repository to your local machine:

    > git clone https://github.com/your-username/The-Anime-Database.git
   
5. Navigate to the Project Directory

    > Change into the project's root directory:

    > cd The-Anime-Database

6. Install Dependencies

    > Install the required npm packages:

    > bash

    > npm install

7. Database Setup

Make sure you have PostgreSQL installed on your machine. Create a database and configure the connection in the index.js file. Use the following SQL queries to set up the necessary tables:

    > CREATE TABLE users (
    >    user_id SERIAL PRIMARY KEY,
    >    user_name VARCHAR(50),
    >    email VARCHAR(50),
    >    password VARCHAR(50) UNIQUE
    > );

    > CREATE TABLE reviews (
    >    id SERIAL PRIMARY KEY,
    >    anime_id INT,
    >   review TEXT,
    >    date VARCHAR(50),
    >    user_id INT REFERENCES users(user_id) ON DELETE CASCADE
    > );

    > CREATE TABLE animelist (
    >    id SERIAL PRIMARY KEY UNIQUE,
    >    anime_id INT,
    >    score INT CHECK (score >= 1 AND score <= 10),
    >    status VARCHAR(50),
    >    user_id INT REFERENCES users(user_id) ON DELETE CASCADE
    > );

    > CREATE TABLE favoritelist (
    >    id SERIAL PRIMARY KEY,
    >    animeid INT,
    >    user_id INT REFERENCES users(user_id) ON DELETE CASCADE
    > );

8. Starting the Project

Now that you've set up the database and installed the dependencies, you can start the project:

  > npm start

Visit **http://localhost:3000** in your browser to access The Anime Database.
