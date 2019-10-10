// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var assert = require('assert').strict;

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
  app.post("/api/note", function (req, res) {

    // console.log('DEBUG:\n-------------------');
    // console.log(req.body);

    // Extract and parse data from request
    let categoryId = req.body.categoryId;
    let userId = req.body.userId;

    // Check that data is valid. If not, return 'bad request' status code and halt further operations
    try {
      assert(userId, 'No user ID provided.');
      assert(categoryId, 'No store category identifier provided.');
    } catch (err) {
      if (err instanceof assert.AssertionError) {
        res.status(400).end();
        return;
      } else {
        throw (err);
      }
    }

    // Build data package, making sure that unsuplied values are set to null since we don't want undefined going into the db
    let quality = req.body.quality || null;
    let quantity = req.body.quantity || null;
    let price = req.body.price || null;
    let note = req.body.note || null;

    let noteDataPackage = {
      CategoryEntryId: categoryId,
      UserId: userId,
      quality: quality,
      quantity: quantity,
      price: price,
      textNote: note
    }

    // Make sure matching entry does not alreayd exist. If not, proceed.
    db.Note.findOrCreate({
      where: {
        UserId: userId,
        CategoryEntryId: categoryId
      },
      defaults: noteDataPackage
    })
      .then(() => {
        // After successfull creation of note, if any ratings have been added,
        // grab data from the coresponding category in order to update ratings as neccessary
        if ((quantity || quantity || price) !== null) {
          let categoryData;
          db.CategoryEntry.findAll({
            where: { id: categoryId }
          })
            .then((responseA) => {
              // Then use returned data to to construct an update package for the 
              categoryData = responseA[0].dataValues;
              let categoryUpdatePackage = createRatingsUpdatePackage(categoryData, noteDataPackage)
              // And finally update the category with the ratings changes
              db.CategoryEntry.update(categoryUpdatePackage, { where: { id: categoryData.id } })
                .then((responseB) => {
                  res.status(200).json(responseB);
                })
                .catch((err) => {
                  res.status(500).json(`Error: ${err}`);
                  //TODO: Handle error and inform user
                });

            })
            .catch((err) => {
              res.status(500).json(`Error: ${err}`);
              //TODO: Handle error and inform user
            });
        }

      })
      // Catch from Note findOrCreate query
      .catch((err) => {
        res.status(500).json(`Error: ${err}`);
        //TODO: Handle error and inform user
      })

  });

  // Route for updating a personal rating and/or note
  app.put("/api/note", function (req, res) {

    // Extract and parse data from request
    let noteId = req.body.noteId;

    assert(noteId, 'No note ID key provided.');

    let preUpdateKey = ['quality', 'quantity', 'price', 'textNote'];

    let preUpdatePackage = [
      req.body.quality,  // 0
      req.body.quantity, // 1
      req.body.price,    // 2
      req.body.note      // 3
    ];

    // Construct an object specifying the value for each cell to be updates, but not specifying any update if the provided value was undefined
    // If the user wants to blank out a value by setting it to null or 0, that will be sent to the update, but if no value at all is supplied
    // Then we'll just ignore that key

    let updatePackage = {};
    let ratingTypes = [];

    for (let i = 0; i < preUpdatePackage.length; i++) {
      if (preUpdatePackage[i] !== undefined) {
        updatePackage[preUpdateKey[i]] = preUpdatePackage[i]
        if (i !== 'textNote') { ratingTypes.push(preUpdateKey[i]) };
      }
    }

    // Before delivering the update, we need to grab the current values so we can see if the changes
    // will affect any other tables
    // First we grab the data
    let oldData;
    db.Note.findAll({
      where: { id: noteId }
    }).then((response1) => {
      oldData = response1[0].dataValues;

      // Once we have the current (soon to be old) values for the user note, we can use the Fkey from that to grab the categoryEntry data
      // from there we can do the math to update any global rating averages we need to
      let currentCategoryData;
      db.CategoryEntry.findAll({
        where: { id: oldData.CategoryEntryId }
      }).then((response2) => {
        currentCategoryData = response2[0].dataValues;
        let globalUpdatePackage = createRatingsUpdatePackage(currentCategoryData, updatePackage, oldData);

        // Before we proceed, we'll double check that our new values are valid. If note, we'll manually rebuild the global average figures
        // TODO: Create function that queries all ratings for store category and rebuilds the averages 
        // TODO: Find a way to check for data integrity and trigger the rebuild function when discrepencies are detected 

        // Now that we have all of our new data ready to go, we'll send two updates to the database
        // we'll make both calls one after the other and then collect the resuls only when both succeed
        let dbUpdates = [];
        dbUpdates.push(db.Note.update(updatePackage, { where: { id: noteId } }));
        dbUpdates.push(db.CategoryEntry.update(globalUpdatePackage, { where: { id: currentCategoryData.id } }));
        Promise.all(dbUpdates)
          .then((response) => {
            res.status(200).json([response[0], response[1]])
          })
          .catch((err) => { res.status(500).json(err) });

      })
        .catch((err) => {
          res.status(500).json(err);
        });
    })
      .catch((err) => {
        res.status(500).json(err);
      });

  });

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

// Function for finding out if the value is defined, but falsy
function isNill(val) {
  if (val === null || val === 0) { return true };
  return false;
};

// Takes current data from a user note and corespoinding category, together with new data from a user note
// and generates the neccessary data package to update the category accordingly 
function createRatingsUpdatePackage(currentCategoryData, newNoteData, oldNoteData = { quality: 0, quantity: 0, price: 0 }) {
  let ratingTypes = [];
  if (newNoteData.quantity !== undefined) { ratingTypes.push('quantity') };
  if (newNoteData.quality !== undefined) { ratingTypes.push('quality') };
  if (newNoteData.price !== undefined) { ratingTypes.push('price') };
  let globalUpdatePackage = {};
  for (let i = 0; i < ratingTypes.length; i++) {

    if (
      (oldNoteData[ratingTypes[i]] != newNoteData[ratingTypes[i]]) && (
        !(isNill(oldNoteData[ratingTypes[i]]) && isNill(newNoteData[ratingTypes[i]])
        ))
    ) {

      let oldAvg = parseFloat(currentCategoryData[`${ratingTypes[i]}Avg`]);
      if (isNaN(oldAvg)) { oldAvg = 0 };
      let oldTotal = parseInt(currentCategoryData[`${ratingTypes[i]}Total`]);
      if (isNaN(oldTotal)) { oldTotal = 0 };
      let newRating = parseInt(newNoteData[`${ratingTypes[i]}`]);
      if (isNaN(newRating)) { newRating = 0 };
      let oldRating = parseInt(oldNoteData[`${ratingTypes[i]}`]);
      if (isNaN(oldRating)) { oldRating = 0 };

      // If the old rating was nill, then we'll need to update the global ratings average as well as increment the number of total ratings
      if (isNill(oldNoteData[ratingTypes[i]])) {

        globalUpdatePackage[`${ratingTypes[i]}Avg`] = ((oldAvg * oldTotal) + newRating) / (oldTotal + 1);
        globalUpdatePackage[`${ratingTypes[i]}Total`] = oldTotal + 1;

      }
      // If the new rating is being set to null, then we'll need to update the global ratings and decrement the total number of ratings
      else if (isNill(newNoteData[ratingTypes[i]])) {

        // First we need to check for the edge case of removing the last/only rating as that will lead to a 0 divided by 0 situation
        // also there is no point in doing math to figure out the number or average if we already know we'll have no more ratings. Ie 0 is 0 is 0
        if (oldTotal === 1) {
          globalUpdatePackage[`${ratingTypes[i]}Avg`] = 0;
          globalUpdatePackage[`${ratingTypes[i]}Total`] = 0;
        } else {
          // If we didn't encounter the edge case, we can use the normal logic:
          globalUpdatePackage[`${ratingTypes[i]}Avg`] = ((oldAvg * oldTotal) - oldRating) / (oldTotal - 1);
          globalUpdatePackage[`${ratingTypes[i]}Total`] = oldTotal - 1;
        }
      }

      // Finally, if we're changing from non-null to non-null value, then we can simply edit the average and leave the total alone
      else if ((newNoteData[ratingTypes[i]]) && (oldNoteData[ratingTypes[i]])) {

        globalUpdatePackage[`${ratingTypes[i]}Avg`] = (((oldAvg * oldTotal) - oldRating) + newRating) / (oldTotal);

      }

      // Above was all cases, so if the below else clause triggers it means an error state
      else {

        let err = new Error('An uknown error occured while attempting to parse date for the update.');
        throw (err);
      }
    }
  }
  return globalUpdatePackage;

}

// For debugging purposes only
class PsuedoError extends Error {
  constructor(message) {
    super(message);
    this.name = "PsuedoError";
  }
}

var logStatus = (variablesToPrint) => {

  console.log('\n----------------------------------\nDEBUG:\n----------------------------------');

  // Now we go though a WHOLE rigamaroll just to grab the one line we want out of the stack trace and ignore the rest:
  let err;
  try {
    let psuedoError = new PsuedoError('Not a real error.')
    throw (psuedoError)
  }
  catch (someError) {
    if (someError instanceof PsuedoError) {
      err = someError
    }
    else {
      console.log('Oops logStatus function caught an error it was not supposed to.')
      console.log(someError)
      throw (someError)
    }
  }

  let caller_lines = err.stack.split("\n");
  let caller_line;
  let flag = false;
  for (let logj = 0; logj < caller_lines.length; logj++) {
    if (caller_lines[logj].includes('api-routes.js')) {
      if (flag) {
        caller_line = caller_lines[logj];
        break;
      } else {
        flag = true;
      }
    };
  };

  let index = caller_line.indexOf("at ");
  let clean = caller_line.slice(index + 2, caller_line.length);
  console.log(clean);

  // Now, having gotten and printed the single stack trace line we want, we print the variable values entered by the user
  let printKeys = Object.keys(variablesToPrint);
  for (let logi = 0; logi < printKeys.length; logi++) {
    console.log(`\nValue for: ${printKeys[logi]}`);
    console.log(variablesToPrint[printKeys[logi]]);

  }

  console.log('----------------------------------\n');

};