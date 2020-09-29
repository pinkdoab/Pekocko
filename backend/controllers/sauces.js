const Sauce = require("../models/sauce");
const fs = require('fs');

//creation d'une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: []
  });
  sauce.save()
      .then(() => {res.status(201).json({message: 'Sauce enregistrée!'});})
      .catch((error) => {res.status(400).json({ error });});
};

//Appel toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {res.status(200).json(sauces);})
    .catch((error) => {res.status(400).json({ error });
  });
};

//Appel UNE sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id})
    .then((sauce) => {res.status(200).json(sauce);})
    .catch((error) => {res.status(404).json({ error });
  });
};

//Efface UNE sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};
//Modifie UNE sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
  {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
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
// like or dislike the sauce, cancel the like or the dislike
exports.likeSauce = (req, res, next) => {
  switch (req.body.like){
      //cancel = 0
      //check if the user had liked or disliked the sauce
      //uptade the sauce, send message/error
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
      //uptade the sauce, send message/error
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
      //uptade the sauce, send message/error
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