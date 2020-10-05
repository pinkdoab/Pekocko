const Sauce = require("../models/sauce");
const fs = require('fs');

// creation d'une sauce
exports.createSauce = (req, res, next) => {

  console.log(req.body.sauce)
  const sauceObject = JSON.parse(req.body.sauce);
  console.log(sauceObject)
  delete sauceObject._id;

  const sauce = new Sauce({
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: []
  });

  console.log(sauce)
  sauce.save()
    .then(() => res.status(201).json({message: 'Sauce enregistrée!'}))
    .catch(error => res.status(400).json({ error }));
};

// Appel toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

// Appel UNE sauce
exports.getOneSauce = (req, res, next) => {
  console.log(req.params.id)
  Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(400).json({ error }));
};

//Efface UNE sauce
exports.deleteSauce = (req, res, next) => {
  console.log("req.params.id : " + req.params.id)                               // req.params.id : 5f78a1b7581a95170db7732a
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      console.log("sauce.imageUrl : " + sauce.imageUrl)                         // sauce.imageUrl : http://localhost:3000/images/SP_2_1601741239680.jpg
      const filename = sauce.imageUrl.split('/images/')[1];
      console.log("filename : " + filename)                                     // filename : SP_2_1601741239680.jpg
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

// Modifie UNE sauce
exports.modifySauce = (req, res, next) => {
  console.log(req.body.sauce)
  //console.log("req.body  : " + req.body)
  //console.log("req.body.heat  : " + req.body.heat)
  //console.log("req.body.name  : " + req.body.name)
  const sauceObject = req.file ?
  {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
  console.log(sauceObject)
  if(req.file){
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id })
          .then(() => {res.status(201).json({message: 'Sauce mise à jour!'});})
          .catch((error) => {res.status(400).json({error: error});});
        })
      })
      .catch((error) => {res.status(500).json({error: error});});       
  }else{
    Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id })
    .then(() => {res.status(201).json({message: 'Sauce mise à jour!'});})
    .catch((error) => {res.status(400).json({error: error});}); 
  }
};

// aime ou non une sauce
exports.likeSauce = (req, res, next) => {
  switch (req.body.like){
      //effacer = 0
      case 0:
          Sauce.findOne({ _id: req.params.id })
              .then((sauce) => {
                  if(sauce.usersLiked.find(user => user === req.body.userId)){
                      Sauce.updateOne({_id: req.params.id}, { 
                          $inc:{likes:-1 }, 
                          $pull:{usersLiked: req.body.userId}, 
                          _id: req.params.id 
                      })
                          .then(() => {res.status(201).json({message: 'Ton avis a été pris en compte!'});})
                          .catch((error) => {res.status(400).json({error: error});});
                      
                  }if(sauce.usersDisliked.find(user => user === req.body.userId)){
                      Sauce.updateOne({_id: req.params.id}, { 
                          $inc:{dislikes:-1 }, 
                          $pull:{usersDisliked: req.body.userId}, 
                          _id: req.params.id 
                      })
                          .then(() => {res.status(201).json({message: 'Ton avis a été pris en compte!'});})
                          .catch((error) => {res.status(400).json({error: error});});
                  }
              })
              .catch((error) => {res.status(404).json({error: error});});    
          break;
      //likes = 1
      case 1:
          Sauce.updateOne({_id: req.params.id}, { 
              $inc:{likes:1 }, 
              $push:{usersLiked: req.body.userId}, 
              _id: req.params.id 
          })
              .then(() => {res.status(201).json({message: 'Ton avis a été pris en compte!'});})
              .catch((error) => {res.status(400).json({error: error});});
          break;
      //likes = -1
      case -1:
              Sauce.updateOne({_id: req.params.id}, { 
                  $inc:{dislikes:1 }, 
                  $push:{usersDisliked: req.body.userId}, 
                  _id: req.params.id 
              })
                  .then(() => {res.status(201).json({message: 'Ton avis a été pris en compte!'});})
                  .catch((error) => {res.status(400).json({error: error});});
          break;
      default:
          console.error('not today : mauvaise requête');
  }
};