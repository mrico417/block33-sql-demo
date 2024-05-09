const express = require('express');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');

const app = express();

app.use(express.json());
app.use(require('morgan')('dev'))

const init = async() => {

    try {

        await client.connect();

        const createTablesSQL = `

            DROP TABLE IF EXISTS notes;
            CREATE TABLE notes(
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now(),
                ranking INTEGER DEFAULT 3 NOT NULL,
                txt VARCHAR(255) NOT NULL,
                category_id INTEGER REFERENCES categories(id) NOT NULL
            );

            DROP TABLE IF EXISTS categories CASCADE;
            CREATE TABLE categories(
                id SERIAL PRIMARY KEY,
                name VARCHAR(25) NOT NULL
            );

            INSERT INTO categories(name) VALUES('Front End');         
            INSERT INTO notes(ranking,txt,category_id) VALUES(1,'HTML', (SELECT id FROM categories WHERE name='Front End'));
            `;

        await client.query(createTablesSQL);
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT,()=> console.log(`App listening on port ${PORT}...`));

    } catch (error) {
        console.log(error);
    }

};

init();