// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");

module.exports = function (app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function (req, res) {
    res.json(req.user);
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/signup", function (req, res) {
    db.User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password
    })
      .then(function () {
        res.redirect(307, "/api/login");
      })
      .catch(function (err) {
        console.log('caught login error');
        console.log(err);
        res.status(401).json(err);
      });
  });

  // Route for logging user out
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function (req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });

  // Route for performing a store seach
  app.get("/api/search", function (req, res) { });

  // Route for getting info for a particular store
  app.get("/api/stores", function (req, res) { });

  // Rote for adding a new store
  app.post("/api/stores", function (req, res) {

    // Parse incoming data object
    // Format: req.body = {name: 'storeName', address: 'StoreAddress', categories: ['someCategory','someOther']}

    let storeName = req.body.name;
    let address = req.body.address;
    let categoryList = req.body.categories;
    let fashion = Boolean(categoryList.includes('fashion'));
    let furniture = Boolean(categoryList.includes('furniture'));
    let homeGoods = Boolean(categoryList.includes('home goods'));
    let misc = Boolean(categoryList.includes('misc'));

    // Check that a store with similar name & address does not already exist
    //TODO: Clientside address validation using Smart Streets OR JUST USE GOOGLE'S AUTOCOMPLETE API
    //TODO: Google maps based comparison via address 

    // Create new database entry
    db.Store.create({
      name: storeName,
      address: address,
      hasFashion: fashion,
      hasFurniture: furniture,
      hasHomeGoods: homeGoods,
      hasMisc: misc
    })
      .then((response) => {

        // Grab new store ID from response & validate
        let newStoreID = response.dataValues.id;
        assert((newStoreID) => {
          try { newStoreID = parseInt(newStoreID) } catch (err) { return false };
          if (isNaN(newStoreID)) { return false };
          if (newStoreID < 1) { return false };
          return true;
        }, "Failed to retrieve proper store ID from database")


        // Create as many entries in the categoryEntry table as needed 
        let promiseList = [];
        for (let i = 0; i < categoryList.length; i++) {
          let dbPromise = db.CategoryEntry.create({
            StoreId: newStoreID,
            type: categoryList[i]
          })
          promiseList.push(dbPromise);
        }

        // Wait until all the category entries are created, and then report status and new store's id after all operations have succeeded
        Promise.all(promiseList).then((results) => {
          res.json({success: true, newStoreId: results[0].StoreId});
        })
        // Report any errors to the console
        .catch((err => {
          res.json(`Async error during categoryEntry creation:\n${err}`);
          //TODO: Handle error and inform user
        }))


      })
      .catch((err) => {
        res.json(`Async error during store creation:\n${err}`);
        //TODO: Handle error and inform user
      })
  })

  // Route for adding a rating and/or note to an existing store
  app.post("/api/stores/:id/:userID", function (req, res) { });

  // Route for updating a personal rating and/or note
  app.put("/api/stores/:id/:userID", function (req, res) { });

  // Route for adding a tag to a store category 
  app.put("/api/stores/:id/:category", function (req, res) { });

  // Route for adding a category to a store
  app.post("/api/stores/:id/:category", function (req, res) { });

};


// I like being able to assert things, a la Python, so I've added my own assertion function here
// complete with custom Error object
class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
};

function assert(value, message = "") {
  if (!value) {
    throw (AssertionError(message))
  }
  else { return true };
}