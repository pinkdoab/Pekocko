const express = require('express'),         // app.METHOD(PATH, HANDLER) app est une instance d’express, METHOD est une méthode de demande HTTP, PATH est un chemin sur le serveur, HANDLER est la fonction exécutée lorsque la route est mise en correspondance
      app = express(),
      bodyParser = require('body-parser');

const mongoose = require('mongoose');       // Connection à MongoDB

const path = require('path');               // pour travailler avec les chemins de fichiers

const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauces');

// Connection à mongodb base: bdPekocko  MdP: ampoule59
mongoose.connect('mongodb+srv://pink2:cheval2@cluster0.5jydf.gcp.mongodb.net/bdPekocko?retryWrites=true&w=majority',
    { useNewUrlParser: true,
      useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(bodyParser.json());     // analyse le texte en JSON et expose l'objet résultant req.body

// 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);


module.exports = app;