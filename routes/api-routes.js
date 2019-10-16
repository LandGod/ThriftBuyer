// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var assert = require('assert').strict;

module.exports = function (app) {

  // Import Sequelize query operators
  const Op = db.Sequelize.Op;
  // Define my best attempt to make a Sequelize wildcard
  const WILDCARD = { [Op.like]: "%" }

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
        logStatus({ thisRoute: "/api/signup", reqbody: req.body }, err)
        res.status(401).send(err);
      });
  });

  // Route for logging user out
  app.get("/logout", function (req, res) {

    let backURL = req.header('Referer') || '/';
    if ((backURL.indexOf('localhost') === -1 && (backURL.indexOf('tranquil-temple-50803.herokuapp.com/') === -1))) { backURL = '/' };

    req.logout();
    res.redirect(backURL);
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

  // Route for performing a store seach using various parameters
  app.get("/api/search", function (req, res) {
    let request = req.query;

    // Search Parameters=default:
    // Category=any, Tag=None, address=none, nearAddress=noLimit, minimumRating=none

    //TODO: Data validation for categories
    try { } catch (error) { res.status(400).send(error); return };

    //TODO: Data validation for address
    try { } catch (error) { res.status(400).send(error); return };

    //TODO: Data validation for ratings
    try { } catch (error) { res.status(400).send(error); return };

    db.Store.findAll({
      include: [
        {
          model: db.CategoryEntry,

          // We're using `|| WILDCARD` to specify that if no value is provided, the search should return any value for that query
          // WILDCARD === {[Op.like]: "%"}
          where: {
            // If a type is specified, we require any category to include that value for type in order to be a match
            type: request.type || WILDCARD,
            // If a minimum rating is supplied, we'll for that to, or just say minimum rating of 0 or greater, since no rating can be lower
            qualityAvg: { [Op.gte]: request.minimumQuality || 0 },
            quantityAvg: { [Op.gte]: request.minimumQuantity || 0 },
            priceAvg: { [Op.gte]: request.minimumPrice || 0 }
          },
          include: [{
            model: db.Tag,
            where: { tagText: request.tag || WILDCARD }
          }]
        }]
    })
      .then((response) => {
        //TODO: I don't think I can reasonably do address checking/comparison in the main query 
        // so I should add that in here once I get the google maps API up and running for this project
        res.status(200).json(response);
      })
      .catch((error) => {
        logStatus({ route: "GET: api/search", operation: "db.Store.findAll()" }, error)
        res.status(500).send(error);
      });

  });

  // Route for getting info for a particular store via its unique id
  app.get("/api/stores", function (req, res) {

    let storeId = req.body.storeId;

    db.Store.findOne({
      where: { id: storeId }
    })
      .then((response) => {
        res.status(200).json(response)
      })
      .catch((error) => {
        logStatus({ route: "GET: api/stores", reqBody: req.body }, error)
        res.status(500).send(error)
      })

  });

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
            logStatus({ route: "POST: api/stores", operation: "Promise.all on multiple category creates" }, err)
            res.send(err);
            //TODO: Handle error (probably delete entire store) and inform user
          }))


      })
      .catch((err) => {
        logStatus({ route: "POST: api/stores", operation: "db.Store.create()" }, err)
        res.send(err);
        //TODO: Handle error and inform user
      })
  })

  // Route for adding a rating and/or note to an existing store for the first time
  // if any of this information already exists for the user then a PUT shoudl be used instead
  app.post("/api/note", function (req, res) {

    // Extract and parse data from request
    let categoryId = req.body.categoryId;
    let userId = req.user.id;

    // Check that data is valid. If not, return 'bad request' or 'unauthorized' status code and halt further operations
    try { assert(userId, 'Not logged in') }
    catch (err) { if (err instanceof assert.AssertionError) { res.status(401).end(); return } else { throw (err) } };

    try { assert(categoryId, 'No store category identifier provided.') }
    catch (err) { if (err instanceof assert.AssertionError) { res.status(400).end(); return } else { throw (err) } };


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
                  logStatus({ route: "POST: Api/note", operation: 'db.CategoryEntry.update()' }, err);
                  res.status(500).send(err);
                  //TODO: Handle error and inform user
                });

            })
            .catch((err) => {
              logStatus({ route: "POST: Api/note", operation: 'db.CategoryEntry.findAll()' }, err);
              res.status(500).send(err);
              //TODO: Handle error and inform user
            });
        }

      })
      // Catch from Note findOrCreate query
      .catch((err) => {
        logStatus({ route: "POST: Api/note", operation: 'db.Note.findOrCreate()' }, err);
        res.status(500).send(err);
        //TODO: Handle error and inform user
      })

  });

  // Route for updating a personal rating and/or note
  app.put("/api/note", function (req, res) {

    // Make sure user is logged in, if not, reject request with 401 unauthorized
    try { assert(req.user, 'Not logged in') }
    catch (err) { if (err instanceof assert.AssertionError) { res.status(401).end(); return } else { logStatus({ route: 'PUT: api/note' }, err) } };

    // Extract and parse data from request
    let categoryId = req.body.categoryId;

    try { assert(categoryId, 'No category id identifier provided.') }
    catch (err) { if (err instanceof assert.AssertionError) { res.status(400).end(); return } else { throw (err) } };

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
      where: {
        UserId: req.user.id,
        CategoryId: categoryId
      },
      // include: [db.CategoryEntry]    // TODO: Reforfactor this and below to use include instead of doing two seperate queries 
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
          .catch((err) => { logStatus({ route: 'PUT: Api/note', operation: "Promise.all on db.Note.upadate() & db.CategoryEntry.update" }, err); res.status(500).send(err) });

      })
        .catch((err) => {
          logStatus({ route: 'PUT: Api/note', operation: "db.CategoryEntry.findAll()" }, err);
          res.status(500).send(err);
        });
    })
      .catch((err) => {
        logStatus({ route: 'PUT: Api/note', operation: "db.Note.findAll()" }, err);
        res.status(500).send(err);
      });

  });

  // Route for retrieving existing personal rating/note data
  app.get("/api/note", function (req, res) {

    // Make sure user is logged in, if not, reject request with 401 unauthorized, otherwise, save the user id
    try { assert(req.user, 'Not logged in') }
    catch (err) { if (err instanceof assert.AssertionError) { res.status(401).end(); return } else { logStatus({ route: 'PUT: api/note' }, err) } };
    let userId = req.user.id;

    // Then extract the categoryId and check to make sure its valid
    let categoryId = req.query.categoryId;
    try { assert(categoryId, 'No category id identifier provided.') }
    catch (err) { if (err instanceof assert.AssertionError) { res.status(400).send('No category Id was provided'); return } else { logStatus({ route: 'PUT: api/note' }, err) } };

    // Then make the db request
    db.Note.findOne({
      where: {
        UserId: userId,
        CategoryEntryId: categoryId
      }
    })
      .then((results) => {
        //TODO: Send actual results.
        // Eventually we'll send results to the user, but for testing purposes, we're just going to send a 404
        // Which is what SHOULD be sent if the user simply has no note data for the specified category
        if (results === null) {res.status(404).end(); return}
        else {console.log('DEBUG: Got results:'); console.log(results)}

      })
      .catch((err) => {
        logStatus({ route: "GET: api/note" }, err)
        res.status(500).send(err);
      });

  });

  // Route for adding a tag to a store category
  app.post("/api/tag", function (req, res) {

    // Grab request information and parse
    let tagInfoPackage = req.body;
    // Validate that incoming information is useable and propper 
    try {
      assert(tagInfoPackage.tagText, 'No data tag text recieved.')
      tagInfoPackage.tagText = tagInfoPackage.tagText.trim().toLowerCase();
      assert(tagInfoPackage.tagText, 'Tag text may not be blank');
      assert(!isNaN(parseInt(tagInfoPackage.CategoryEntryId)), 'Invalid category ID');
      assert(parseInt(tagInfoPackage.CategoryEntryId) > 0, 'Invalid category ID');
      assert(tagInfoPackage.UserId, 'Missing user ID of tag creator');
      assert(!isNaN(parseInt(tagInfoPackage.UserId)), 'Invalid user ID');
    } catch (err) {
      logStatus({ route: "POST: api/tag", operation: "Data Validation" }, err)
      res.status(400).send(err);
      return;
    }

    // If we pass the initial validation, then we'll do the post as a findOrCreate, so if the tag is a duplicate, it will be rejected
    db.Tag.findOrCreate({
      where: { CategoryEntryId: tagInfoPackage.CategoryEntryId, tagText: tagInfoPackage.tagText },
      defaults: tagInfoPackage
    })
      .then((response) => {
        // TODO: Test the below code for reporting failure due to duplicate tag
        if (response[0] > 0) { res.status(400).send("Tag already exists.") };
        res.status(200).json(response);
      })
      .catch((err) => {
        logStatus({ route: "POST: api/tag", operation: "db.Tag.findOrCreate()" }, err);
        res.status(500).send(err);
        return;
      })

  });

  // Route for adding a category to a store 
  app.post("/api/category", function (req, res) {
    let StoreId = req.body.StoreId;
    let type = req.body.type;

    try {
      type = type.trim().toLowerCase();
      assert(['fashion', 'furniture', 'home goods', 'misc'].includes(type));
    } catch (error) {
      res.status(400).send('Invalid store type');
    };

    try {
      assert((StoreId) => {
        try { StoreId = parseInt(StoreId) } catch (err) { return false };
        if (isNaN(StoreId)) { return false };
        if (StoreId < 1) { return false };
        return true;
      }, "Invalid Store ID")
    } catch (err) {
      res.status(400).send('Invalid Store ID to add category')
    };

    // Create new categoryEntry table row, while making sure this isn't a duplicate, 
    // then update Store entry to reflect existence of category 
    // We'll add both query Promises to a list so we can handle both results at the same time via Promise.all
    let databaseQueries = [];
    databaseQueries.push(
      db.CategoryEntry.findOrCreate({
        where: { StoreId: StoreId, type: type },
        defaults: { StoreId: StoreId, type: type }
      }))

    let storeUpdatePackage = {};
    // construct proper column name for store column specifying category as object key and set value to true
    let normalizedCategoryName = (type) => {
      if (type === 'home goods') { return 'HomeGoods' } // if special case, get special treatment
      else { return type.charAt(0).toUpperCase() + type.slice(1) } // else capitalize
    }
    storeUpdatePackage[`has${normalizedCategoryName(type)}`] = true;

    databaseQueries.push(
      db.Store.update(
        storeUpdatePackage,
        {
          where: { id: StoreId }
        })
    )
    Promise.all(databaseQueries)
      .then((results) => {
        res.json(results);
      })
      // Report any errors to the console
      .catch((err => {
        logStatus({ Route: 'POST: api/category', operation: "Promise.all(databaseQueries)" }, err);
        res.send(err);
        //TODO: Handle error (probably delete entire store) and inform user
      }))
  });

  // Route for getting a category(s) when you know the associated store id already
  app.get("/api/category", function (req, res) {

    // Input validation
    try { assert(req.query.storeId, 'StoreId is undefined in req.query to GET: /api/category'); }
    catch (error) { logStatus({ Route: 'GET: api/category', reqQuery: req.query, reqQueryStoreId: req.query.storeId }, error) };

    db.CategoryEntry.findOne({
      where: {
        StoreId: req.query.storeId,
        type: req.query.type
      }
    })
      .then((response) => {
        res.status(200).json(response)
      })
      .catch((error) => {
        logStatus({ Route: 'GET: api/category', operation: "db.CategoryEntry.findOne()" }, error);
        res.status(500).send(error)
      })

  });

  // _________________________________________________________________________________________________ \\

  // FOR DEBUG ONLY: SEEDS:
  app.post("/api/test/seed", function (req, res) {

    // Create some stores:
    async function makeAStore(nm, catList, adrs) {

      return new Promise((resolve) => {

        let categoryList = catList;

        db.Store.create({
          name: nm,
          address: adrs,
          hasFashion: catList.includes('fashion'),
          hasFurniture: catList.includes('furniture'),
          hasHomeGoods: catList.includes('home goods'),
          hasMisc: catList.includes('misc')
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
          resolve(Promise.all(promiseList))
        })
      })
    }
    Promise.all([
      makeAStore("Joe's Example Business", ['furniture', 'home goods', 'misc'], "95 7th Ave SE, Suit 17, Seattle, WA 98026"),
      makeAStore("Greg's Salvage", ['furniture', 'fashion', 'misc'], "403 Archon Way NW, Seattle, WA 98026"),
      makeAStore("BadWill", ['furniture'], "1 Middle Way, Nowhere, AZ 42357")
    ])
      // Then some create users
      .then(() => {

        // Create a users:
        let userCreate = function (name, email, password) {
          return db.User.create({
            userName: name,
            email: email,
            password: password
          })
        }
        Promise.all([
          userCreate('TestUserOne', 'UserOne@test.domain', '123456'),
          userCreate('TestUserTwo', 'UserTwo@test.domain', '123456'),
          userCreate('TestUserThree', 'UserThree@test.domain', '123456'),
        ])
          .then(function () {
            res.json('Done')
          })
          .catch(function (err) {
            logStatus({ Route: 'Seeds' }, err);
            res.send(err);
          });

      })
      .catch((err => {
        logStatus({ Route: 'Seeds' }, err);
        res.send(err);
        //TODO: Handle error (probably delete entire store) and inform user
      }))

  });
  // END DEBUG ROUTES
  // _________________________________________________________________________________________________ \\

}; // End export statment

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

// For debugging purposes only ________________________________________________________________________________________ \\
class PsuedoError extends Error {
  constructor(message) {
    super(message);
    this.name = "PsuedoError";
  }
}

// For debugging. Prints the line from this document that it was called on, along with an object and optional error
var logStatus = (variablesToPrint, error) => {

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
  let currentFileName = 'api-routes.js';
  let caller_lines = err.stack.split("\n");
  let caller_line;
  let flag = false;
  for (let logj = 0; logj < caller_lines.length; logj++) {
    if (caller_lines[logj].includes(currentFileName)) {
      if (flag) {
        caller_line = caller_lines[logj];
        break;
      } else {
        flag = true;
      }
    };
  };

  let index = caller_line.indexOf("js:");
  let clean = caller_line.slice(index + 3, caller_line.length);
  console.log('at line: ' + clean);

  // Now, having gotten and printed the single stack trace line we want, we print the variable values entered by the user
  let printKeys = Object.keys(variablesToPrint);
  for (let logi = 0; logi < printKeys.length; logi++) {
    console.log(`\nValue for: ${printKeys[logi]}`);
    console.log(variablesToPrint[printKeys[logi]]);

  }

  if (error) {
    console.log('The following error object was supplied:')
    console.log(error);
  }

  console.log('----------------------------------\n');

};