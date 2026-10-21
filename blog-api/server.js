const path = require('path'); //build folder paths.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); //settings for env.
const express = require('express'); //Imports Express
const cors = require('cors'); // Imports Cors
const postRoutes = require('./src/routes/postRoutes'); //routes for blog posts, viewing, creating
const meRoutes = require('./src/routes/meRoutes'); //import meroutes.js

const app = express(); //Creates your Express application
app.use(cors());
app.use(express.json()); //Allows Express to read JSON data sent in request bodies.

app.use('/api/posts', postRoutes); //postRoutes router to the /api/posts path
app.use('/api/me', meRoutes); //Connects meRoutes to the /api/me path.

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Invalid JSON body' });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(5000, () => console.log('Blog API running on port 5000')); //Starts the Blog API server on port 5000