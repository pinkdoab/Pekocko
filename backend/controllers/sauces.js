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
  Sauce.findOne({_id: req.params.id})
  .then(sauce => res.status(200).json(sauce))
  .catch(error => res.status(400).json({ error }));
};


//Efface UNE sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
  .then(sauce => {

    //console.log("sauce.userId : " + sauce.userId)   // créateur de la sauce
    //console.log("req.user : " + req.user)           // user en cours

    if (sauce.userId == req.user){   // La sauce appartient à user en cours ?
      //console.log("sauce.imageUrl : " + sauce.imageUrl)                         // sauce.imageUrl : http://localhost:3000/images/SP_2_1601741239680.jpg
      const filename = sauce.imageUrl.split('/images/')[1];
      //console.log("filename : " + filename)                                     // filename : SP_2_1601741239680.jpg
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
        .catch(error => res.status(400).json({ error }));
      });
    }else{
      throw 'Impossible de supprimer la sauce. Elle n\'appartient pas à l\'utilisateur en cours';
    }
  })
  .catch(error => res.status(500).json({ error }));
};

// Modifie UNE sauce
exports.modifySauce = (req, res, next) => {
  //console.log("req.body.sauce : " + req.body.sauce)
  const sauceObject = req.file ?
  {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
  console.log(sauceObject)

  console.log("sauceObject.userId : " + sauceObject.userId)   // créateur de la sauce
  console.log("req.user : " + req.user)                       // user en cours

  if (sauceObject.userId == req.user){   // La sauce appartient à user en cours ?
    if(req.file){
      Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(201).json({message: 'Sauce mise à jour!'}))
          .catch(error => res.status(400).json({ error }));
        })
      })
      .catch(error => res.status(500).json({ error }));       
    }else{
      Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(201).json({message: 'Sauce mise à jour!'}))
      .catch(error => res.status(400).json({ error }));
    }
  }else{
    throw 'Impossible de modifier la sauce. Elle n\'appartient pas à l\'utilisateur en cours';    
  }
};

// Gestion des Likes et Dislikes
exports.likeSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      // Si like = 1, ajoute userId à usersLiked et likes est égale au nb d'éléments dans usersLiked
      if (req.body.like === 1) {
        if (!sauce.usersLiked.includes(req.body.userId)) {      // évite plusieurs avis positif du même user
          sauce.usersLiked.push(req.body.userId)

          if (!sauce.usersDisliked.includes(req.body.userId)) {
            Sauce.updateOne({ _id: req.params.id },
              { 
                likes: sauce.usersLiked.length,
                usersLiked: sauce.usersLiked,
              }
            )
            .then(res.status(200).json({ message: 'Vous aimez la sauce' }))
            .catch(error => res.status(500).json({ error }))
          } else {
            const indexUserId = sauce.usersDisliked.indexOf(req.body.userId)
            sauce.usersDisliked.splice(indexUserId, 1)
            Sauce.updateOne({ _id: req.params.id },
              { 
                likes: sauce.usersLiked.length,
                usersLiked: sauce.usersLiked,
                dislikes: sauce.usersDisliked.length,
                usersDisliked: sauce.usersDisliked 
              }
            )
            .then(res.status(200).json({ message: 'Vous changez d\'avis. Vous aimez la sauce' }))
            .catch(error => res.status(500).json({ error }))          
          }
        } else {
          throw 'pas plusieurs avis positif du même user';
        }
        // Si like = -1, ajoute userId à usersDisliked et dislikes est égale au nb d'éléments dans usersLiked
      } else if (req.body.like === -1) {
        if (!sauce.usersDisliked.includes(req.body.userId)) {      // évite plusieurs avis négatifs du même user
          sauce.usersDisliked.push(req.body.userId)
          Sauce.updateOne({ _id: req.params.id },
            {
              dislikes: sauce.usersDisliked.length,
              usersDisliked: sauce.usersDisliked
            }
          )
          .then(res.status(200).json({ message: 'Vous n\'aimez pas la sauce' }))
          .catch(error => res.status(500).json({ error }))
      } else {
        throw 'pas plusieurs avis négatif du même user';
      }
        // Si like = 0, supprimer userId de usersLike ou usersDisliked puis update dislikes
      } else if (req.body.like === 0) {

        if (sauce.usersLiked.includes(req.body.userId)) {
          const indexUserId = sauce.usersLiked.indexOf(req.body.userId)
          sauce.usersLiked.splice(indexUserId, 1)
          Sauce.updateOne({ _id: req.params.id },
            {
              usersLiked: sauce.usersLiked,
              likes: sauce.usersLiked.length
            }
          )
          .then(res.status(200).json({ message: 'Pas de commentaire' }))
          .catch(error => res.status(500).json({ error }))

        } else if (sauce.usersDisliked.includes(req.body.userId)) {
          const indexUserId = sauce.usersDisliked.indexOf(req.body.userId)
          sauce.usersDisliked.splice(indexUserId, 1)
          Sauce.updateOne({ _id: req.params.id },
            {
              usersDisliked: sauce.usersDisliked,
              dislikes: sauce.usersDisliked.length
            }
          )
          .then(res.status(200).json({ message: 'Pas de commentaire' }))
          .catch(error => res.status(500).json({ error }))
        } else {
          throw 'impossible commentaire déjà supprimé';
        }
      }
    })
  .catch(error => res.status(500).json({ error }))
}
