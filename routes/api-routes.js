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

  // Route for performing a store seach TODO:
  app.get("/api/search", function (req, res) { });

  // Route for getting info for a particular store TODO:
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
          res.json({ success: true, newStoreId: results[0].StoreId });
        })
          // Report any errors to the console
          .catch((err => {
            res.json(`Async error during categoryEntry creation:\n${err}`);
            //TODO: Handle error (probably delete entire store) and inform user
          }))


      })
      .catch((err) => {
        res.json(`Async error during store creation:\n${err}`);
        //TODO: Handle error and inform user
      })
  })

  // Route for adding a rating and/or note to an existing store for the first time
  // if any of this information already exists for the user then a PUT shoudl be used instead
  app.post("/api/stores/add-note", function (req, res) {

    // console.log('DEBUG:\n-------------------');
    // console.log(req.body);

    // Extract and parse data from request
    let categoryId = req.body.categoryId;
    let userId = req.body.userId;

    assert(userId, 'No user ID provided.');
    assert(categoryId, 'No store category identifier provided.')

    let quality = req.body.quality || null;
    console.log(req.body)
    console.log(quality)
    let quantity = req.body.quantity || null;
    console.log(quantity)
    let price = req.body.price || null;
    console.log(price)
    let note = req.body.note || null;
    console.log(note)

    // Make sure matching entry does not alreayd exist. If not, proceed.

    // The following code is not working. Reason unknown:
    // db.Note.findOrCreate({
    //   where: {
    //     UserId: userId,
    //     CategoryEntryId: categoryId
    //   },
    //   defualts: {
    //     CategoryEntryId: categoryId,
    //     UserId: userId,
    //     quality: quality,
    //     quantity: quantity,
    //     price: price,
    //     textNote: note
    //   }
    // })

    // The following code is not exactly what I want because it doesn't check for existing entries. 
    // however, until I can get what's commented out above working, this is what we're going with.
    // on the bright side, an error from not checking for existing values first is an edge case,
    // since something would also have to have gone wrong on client side in the first place for it to send a POST
    // when there is alreay an entry.
    db.Note.create({
      CategoryEntryId: categoryId,
      UserId: userId,
      quality: quality,
      quantity: quantity,
      price: price,
      textNote: note
    })

      .then((response) => {
        // console.log('DEBUG:\n--------------------------------------')
        // console.log(response)
        res.json(response);  // When success response is recieved, client side code should re-load the page
      })
      .catch((err) => {
        res.json(`Error: ${err}`);
        //TODO: Handle erro and inform user
      });

  });

  // Route for updating a personal rating and/or note TODO:
  app.put("/api/stores/:id/:userID", function (req, res) { });

  // Route for adding a tag to a store category  TODO:
  app.put("/api/stores/:id/:category", function (req, res) { });

  // Route for adding a category to a store TODO:
  app.post("/api/stores/:id/:category", function (req, res) { });

  // _________________________________________________________________________________________________ \\

  // FOR DEBUG ONLY: SEEDS:
  app.post("/api/test/seed", function (req, res) {

    // Create a store:

    let categoryList = ['fashion', 'furniture'];

    db.Store.create({
      name: 'Test Thrift',
      address: '95 1st Ave, Apt 103, Issaquah, WA 98027',
      hasFashion: true,
      hasFurniture: true,
      hasHomeGoods: false,
      hasMisc: false
    }).then((response) => {

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
      Promise.all(promiseList)
        .then((results) => {

          // Create a user:
          db.User.create({
            userName: 'TestUser001',
            email: 'testUser@test.test',
            password: '123456'
          })
            .then(function () {
              res.json('Done')
            })
            .catch(function (err) {
              console.log('caught login error');
              console.log(err);
              res.json(err);
            });

        })
        .catch((err => {
          res.json(`Async error during categoryEntry creation:\n${err}`);
          //TODO: Handle error (probably delete entire store) and inform user
        }))


    }).catch((err) => {
      res.json(`Async error during store creation:\n${err}`);
      //TODO: Handle error and inform user
    })

  });

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