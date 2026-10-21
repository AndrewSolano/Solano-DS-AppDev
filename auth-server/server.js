const path = require('path');   //main server file for Auth Server starts the server, loads the required packages, connects your routes, handles errors
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); //loads environment variables from your .env file
const express = require('express');//imports Express
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes'); //imports the routes register, login, refresh, and logout

const app = express(); //helps you build a web server using Node.js
app.use(cors()); //CORS, which controls whether browsers can allow requests to the server
app.use(express.json());

app.use('/', authRoutes); //connects your authentication router to the main server using /

app.use((req, res) => res.status(404).json({ error: 'Route not found' })); //If a request does not match any registered route
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Invalid JSON body' });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(4000, () => console.log('Auth Server running on port 4000')); //starts the server and makes it listen on port 4000