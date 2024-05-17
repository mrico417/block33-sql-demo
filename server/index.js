// import the express library using CJS
const express = require('express');

// import the pg library to connect to postgres database
const pg = require('pg');

// instantiate a new pg client to the postgress client
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');


// create the express app to run the HTTP server
const app = express();

// prepare the app to handle JSON requests and responses
app.use(express.json());

// setup the app to log messages when express app HTTP server is running
app.use(require('morgan')('dev'))

// create routes
app.get('/api/categories', async (req, res, next)=> {
    
    const sqlGetCategories = ` 
        SELECT * FROM categories
    ;`;

    try {
        const response = await client.query(sqlGetCategories);
        console.log(response);
    
        res.send(response.rows);
        
    } catch (error) {
        next(error)    
    }

});
app.get('/api/notes', async (req, res, next)=> {
    
    const sqlGetNotes = ` 
        SELECT * FROM notes
        ORDER BY created_at DESC
    ;`;

    try {
        const response = await client.query(sqlGetNotes);
        console.log(response);
    
        res.send(response.rows);
        
    } catch (error) {
        next(error)
    }

});

// POST /api/notes
app.post('/api/notes', async (req, res, next)=> {
    
    console.log(req.body);
    const sqlInsertNotes = ` 
        INSERT INTO notes(ranking,txt,category_id) VALUES($1,$2, (SELECT id FROM categories WHERE name=$3))
        RETURNING *
    ;`;

    try {
        const response = await client.query(sqlInsertNotes, [req.body.ranking,req.body.txt,req.body.category_name]);
        console.log(response);
    
        res.send(response.rows[0]);
        
    } catch (error) {
        next(error)
    }

});

// PUT /api/notes/:id
app.put('/api/notes/:id', async (req, res, next)=> {
    
    console.log(req.body);
    const sqlUpdateNote = ` 
        UPDATE notes
        SET ranking=$1, txt=$2, updated_at=now()
        WHERE id=$3
        RETURNING *
    ;`;

    try {
        const response = await client.query(sqlUpdateNote, [req.body.ranking,req.body.txt,req.params.id]);
        console.log(response);
    
        res.send(response.rows[0]);
        
    } catch (error) {
        next(error)
    }

});


// DELETE /api/notes/:id
app.delete('/api/notes/:id', async(req, res, next) => {

    const sqlDeleteNote = `
        DELETE FROM notes
        WHERE id=$1
    ;`;

    try {
        const response = await client.query(sqlDeleteNote, [req.params.id]);
        res.sendStatus(204);               
    } catch (error) {
        next(error)
    }
})

// global error catcher

app.use((error, req, res, next)=> {
    res.status(res.status || 500).send({ error: error });
  });
  

const init = async() => {

    try {

        // start connection to the postgres database
        await client.connect();

        // SQL statement to create the tables and insert dummy data
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
                name VARCHAR(25) UNIQUE NOT NULL 
            );

            INSERT INTO categories(name) VALUES('Front End');         
            INSERT INTO notes(ranking,txt,category_id) VALUES(1,'HTML', (SELECT id FROM categories WHERE name='Front End'));
            INSERT INTO notes(ranking,txt,category_id) VALUES(2,'CSS', (SELECT id FROM categories WHERE name='Front End'));
            INSERT INTO notes(ranking,txt,category_id) VALUES(2,'Javascript', (SELECT id FROM categories WHERE name='Front End'));
            `;

        // call the client to execute the SQL
        await client.query(createTablesSQL);
        
        // define the PORT for the app to listen on
        const PORT = process.env.PORT || 3000;

        // start the express HTTP server
        app.listen(PORT,()=> console.log(`App listening on port ${PORT}...`));

    } catch (error) {
        console.log(error);
    }

};

init();