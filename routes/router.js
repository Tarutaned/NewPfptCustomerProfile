// **************************************************
// /routes/router.js
// Provides basic routing for the app
// **************************************************


const express                 = require('express')
const app                     = new express.Router()
const connectEnsureLogin      = require('connect-ensure-login')
const moment                  = require('moment')
const User                    = require('../models/user')
var {Customer}                = require("../models/customer")
var {CustomerVersions}        = require("../models/customer")
var {SizingQuestions}         = require("../models/sizing")
var {SizingQuestionsVersions} = require("../models/sizing")
var {DesktopNetworkQuestions} = require("../models/desktop_network")
var {EmailQuestions}          = require("../models/email")
var {EmailQuestionsVersions}  = require("../models/email")
var {UsageQuestions}          = require("../models/usage")
var {UsageQuestionsVersions}  = require("../models/usage")
var {ImportQuestions}         = require("../models/import")
var {ImportQuestionsVersions} = require("../models/import")
var {POCQuestions}            = require("../models/poc")
var {POCQuestionsVersions}    = require("../models/poc")
var {RFEQuestions}            = require("../models/rfe")
var {RFEQuestionsVersions}    = require("../models/rfe")
var {SupervisionQuestions}    = require("../models/supervision")
var {DesktopNetworkQuestionsVersions}     = require("../models/desktop_network")
var {ConnectorPlatformQuestions}          = require("../models/connector_platform")
var {ConnectorPlatformQuestionsVersions}  = require("../models/connector_platform")
var {SupervisionQuestionsVersions}        = require("../models/supervision")
const passport = require("../auth/auth")
var mongoose = require('mongoose');

// append is the base URL
var append = "";




// ==================================================
// Display Customers where the current user is listed on the account
// ==================================================
app.get("/", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log(getTimeStamp() + "Displaying MyCustomers page for: " + req.user.sAMAccountName)
  Customer.find({ $or: [{accManager: req.user.cn}, 
                { createdBy: req.user.sAMAccountName},
                { archivingSe: req.user.cn },
                { salesRep: req.user.cn },
                { solutionArchitect: req.user.cn } ]}).then((customers) => {
    return res.render("mycustomers.ejs", { customers: customers, user: req.user })
  }).catch((error) => {
    console.log("An error has occurred.")
    console.log(error)
  })  
})


// ==================================================
// Display the Login page
// ==================================================
app.get('/login', (req, res) => {
  if(!(typeof req.user === 'undefined')) {
    console.log(getTimeStamp() + req.user.sAMAccountName + " is already logged in.")
    return res.redirect("/")
  }
  console.log(getTimeStamp() + "Displaying the login page.")
  res.render('login.ejs')
})


// ==================================================
// Process the Login Form
// ==================================================
app.post('/login', function(req, res, next) {
  console.log(getTimeStamp() + "Processing Login Page.")
  passport.authenticate('ldapauth', function(err, user, info) {
    if (err) { 
      return res.render('error.ejs', {message: err})}
    if (!user) { 
      return res.render('error.ejs', {message: info.message} )}
    req.logIn(user, function(err) {
      if (err) { 
        return res.render('error.ejs', {message: err})
       }
       return res.redirect("/")
    });
  })(req, res, next);
});




// ==================================================
// A Test page
// ==================================================
app.get('/error', (req, res) => {

  res.render('error.ejs', { message: req.flash('error') })
})

app.get('/flash', function(req, res){
  req.flash('error', 'This is a test error')
  res.redirect('/error');
});


// ==================================================
// Display the Profile page
// ==================================================
app.get('/userprofile', connectEnsureLogin.ensureLoggedIn(),(req, res) => {
  const sessionInfo = { expires: req.session.cookie._expires,
                        expiresIn: req.session.cookie.maxAge / 1000}
  res.render('userprofile.ejs', {user: req.user, sessionInfo})
})


// ==================================================
// Return the current User info
// ==================================================
app.get('/user', connectEnsureLogin.ensureLoggedIn(),
  (req, res) => res.send({user: req.user})
)


// =============================================
// Logout
// =============================================
app.get('/logout', function(req, res) {
  if(typeof req.session.passport == 'undefined') {
    return res.redirect('/')  // not logged in
  }

  if(req.session.passport) {
    console.log(getTimeStamp() + "Logout: " + req.session.passport.user.sAMAccountName)
    try {
      req.logout()
      req.session.destroy()
    }
    catch (e) {
      console.log(getTimeStamp() + "Logout Error: " + e)
    }
    // double check
    if(typeof req.session === 'undefined') {
      console.log(getTimeStamp() + "The user is logged out.")
    }
  }
  res.redirect('/')
})


// ======================================================
// Render the Customer List
// ======================================================
app.get("/index", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  Customer.find({}).then((customers) => {
      res.render("index", { customers: customers, user: req.user})
  }).catch((error) => {
      console.log("An error has occurred.")
      console.log(error)
  })
})


// ======================================================
// Display the New Customer Page
// ======================================================
app.get("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  res.render("new", { error_message: undefined, user: req.user });
});


// ======================================================
// Save the New Customer
// ======================================================
app.post("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  if (req == undefined || req == null) {
      console.log('[+] Cannot create new customer.  The req is empty.');
  } else {
      console.log(getTimeStamp() + "Trying to create new customer...");
      const newCustomer = req.body.customer
      newCustomer.createdBy = req.user.sAMAccountName
      newCustomer.updatedBy = req.user.sAMAccountName
      console.log(newCustomer)

      Customer.create(newCustomer)
      .then(customer => {
        customer.save();

        //update the version array in the versioned collection
        CustomerVersions.create({ refId: customer._id, versions: [customer] });
        SizingQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          SizingQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        DesktopNetworkQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          DesktopNetworkQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        EmailQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          EmailQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        ImportQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          ImportQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        ConnectorPlatformQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          ConnectorPlatformQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        POCQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          POCQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        RFEQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          RFEQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        UsageQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          UsageQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        SupervisionQuestions.create({ name: req.body.customer["name"] })
        .then(questions => {
          SupervisionQuestionsVersions.create({ refId: customer._id, versions: [questions] });
        })
        res.redirect("/index");
        console.log(getTimeStamp() + "Created customer '" + req.body.customer["name"]);
      })
      .catch(error => {
        if (error["code"] == 11000) {
            console.log("-- Duplicate entry for customer: '" + req.body.customer["name"] + "'");
            // Send pop up alert to HTML here
            res.render('new', { error_message: "Duplicate entry for customer: " + req.body.customer["name"] });
        } else {
            console.log(error);
        }
      })
  }
});


// ======================================================
// Updates a customer profile
// ======================================================
app.put("/index/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {

  // Update General Questions
  if (req.body.customer != undefined && req.body.customer != null) {
      console.log(getTimeStamp() + "Attempting to update General questions for: " + req.params.id);
      // Determine if each HTML Checkbox is "on" or "undefined"
      const customer_info_chk_box_names = ["existing_archive_prospect", "existing_archive_customer", "existing_security_customer"]
      // See if any of the customer. checkboxes are "unchecked"
      customer_info_chk_box_names.forEach(function(chk_box_name){
        if(!req.body.customer[chk_box_name])
        {
          // if it's undefined, then set it to false
          req.body.customer[chk_box_name] = "false"
        }
      })
      async function updateID() {
        await Customer.findOneAndUpdate({ name: req.params.id }, req.body.customer).exec();
        console.log(getTimeStamp() + "Updated: " + req.params.id);
      }

      
      // This function is needed to create a 2nd DB requset because the first one didn't write the required info !!!
      // TO DO:
      // Get rid of this and make one DB request with all the required info
      updateID().then(() => {
          Customer.findOne({ name: req.params.id })
          .then(customer => {
            customer.updatedBy = req.user.sAMAccountName;
            customer.save();
          })
          .catch(e => {
            console.log(e);
          })
          res.redirect("/index/" + encodeURIComponent(req.body.customer["name"]));
      }).catch((error) => {
          console.log(error);
          if (error["code"] == 11000) { // Dupe ID
              console.log(getTimeStamp() + "Duplicate key for customer: " + req.body.customer["name"]);
              res.status(409);
              res.send("This customer name already exists.");
          } else {
              console.log(error.error_message + "\n---");
          }
      });
  }

    // Updating sizing questions
    if (req.body.sizing_questions != undefined && req.body.sizing_questions != null) {
        console.log(getTimeStamp() + "Attempting to update Sizing Questions...");
        SizingQuestions.findOneAndUpdate({ name: req.params.id }, req.body.sizing_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.sizing_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating desktop network questions
    if (req.body.desktop_network_questions != undefined && req.body.desktop_network_questions != null) {
        console.log(getTimeStamp() + "Attempting to update Desktop Network Questions...");
        DesktopNetworkQuestions.findOneAndUpdate({ name: req.params.id }, req.body.desktop_network_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.desktop_network_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating Email Questions
    if (req.body.email_questions != undefined && req.body.email_questions != null) {
        console.log(getTimeStamp() + "Attempting to update Email Systems Questions...");
        EmailQuestions.findOneAndUpdate({ "name": req.params.id }, req.body.email_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            // console.log(req.body.email_questions);
            console.log(getTimeStamp() + "Updated Email Systems Questions.");
            updateVersions({ name: req.body.email_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating Import Questions
    if (req.body.import_questions != undefined && req.body.import_questions != null) {
        console.log(getTimeStamp() + "Attempting to update Import information...");
        ImportQuestions.findOneAndUpdate({ "name": req.params.id }, req.body.import_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.import_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating Connector Platform Questions
    if (req.body.connector_platform_questions != undefined && req.body.connector_platform_questions != null) {
        console.log(getTimeStamp() + "Update - Connector Platform - " + req.params.id);
        name = "connector_platform_questions[facebook_number_of_users]"
        
        // Need to determine if each HTML Checkbox is "on" or "undefined"
        const connector_platform_chk_box_names = ["facebook", "linkedin", "twitter", "google", "youtube", "files", "skype_in_cloud", "skype_on_prem", "lync_on_prem", "one_drive", "box", "bloomberg", "yammer", "jive", "chatter", "slack", "symphony", "teams", "sharepoint"];
        connector_platform_chk_box_names.forEach(function(chk_box_name){
          let checkedValue = req.body.connector_platform_questions[chk_box_name];
            if(checkedValue) { 
              // Runs if the box is not undefined
              // console.log(getTimeStamp() + "The " + chk_box_name + " box was checked")
          } else { 
            // console.log(getTimeStamp() + " The " + chk_box_name + " box was NOT checked")
            // if the HTML Checkbox is undefined, then add it to req.body.connector_platform_questions
            req.body.connector_platform_questions[chk_box_name] = "false"
          }
        })
        // console.log(JSON.stringify(req.body.connector_platform_questions))
        ConnectorPlatformQuestions.findOneAndUpdate({ name: req.params.id }, req.body.connector_platform_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.connector_platform_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating POC Questions
    if (req.body.poc_questions != undefined && req.body.poc_questions != null) {
        console.log(getTimeStamp() + "Attempting to update POC information...");
        POCQuestions.findOneAndUpdate({ name: req.params.id }, req.body.poc_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.poc_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating RFE Questions
    if (req.body.rfe_questions != undefined && req.body.rfe_questions != null) {
        console.log(getTimeStamp() + "Attempting to update RFE information...");
        RFEQuestions.findOneAndUpdate({ name: req.params.id }, req.body.rfe_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.rfe_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating Usage Questions
    if (req.body.usage_questions != undefined && req.body.usage_questions != null) {
        console.log(getTimeStamp() + "Attempting to update Usage Questions...");
        UsageQuestions.findOneAndUpdate({ name: req.params.id }, req.body.usage_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.usage_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating Finserv Supervision Questions
    if (req.body.supervision_questions != undefined && req.body.supervision_questions != null) {
        console.log(getTimeStamp() + "Attempting to update Finserv Supervision Questions...");
        SupervisionQuestions.findOneAndUpdate({ name: req.params.id }, req.body.supervision_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            console.log("Done");
            updateVersions({ name: req.body.supervision_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Update Versions
    function updateVersions(search_term) {
      console.log(getTimeStamp() + "Updating the Versions arary for: " + search_term.name)
      Customer.findOne(search_term)
      .then(customer => {
        //update the version array in the versioned collection
        CustomerVersions.findOne({ refId: customer._id })
        .then(version => {
          version.versions.push(customer);
          version.save();
        })

        
        SizingQuestions.findOne(search_term)
        .then(questions => {
          SizingQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })

        DesktopNetworkQuestions.findOne(search_term)
        .then(questions => {
          DesktopNetworkQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })

        
        EmailQuestions.findOne(search_term)
        .then(questions => {
          EmailQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
        ImportQuestions.findOne(search_term)
        .then(questions => {
          ImportQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
        ConnectorPlatformQuestions.findOne(search_term)
        .then(questions => {
          ConnectorPlatformQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
        POCQuestions.findOne(search_term)
        .then(questions => {
          POCQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
        RFEQuestions.findOne(search_term)
        .then(questions => {
          RFEQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
        UsageQuestions.findOne(search_term)
        .then(questions => {
          UsageQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
        SupervisionQuestions.findOne(search_term)
        .then(questions => {
          SupervisionQuestionsVersions.findOne({ refId: customer._id })
          .then(version => {
            version.versions.push(questions);
            version.save();
          })
        })
      })
    }

    updateVersions({ name: req.params.id });
});


// ======================================================
// Display a Customer Profile
// ======================================================
app.get("/index/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  // Query every table and grab the results in a blocking manner
  async function query(search_term) {
      var questionnaire = {};
      questionnaire["customer"] = await Customer.findOne(search_term).exec();
      if (questionnaire["customer"]) {
          questionnaire["sizing_questions"] = await SizingQuestions.findOne(search_term).exec();
          //questionnaire["customer"] = await Customer.findOne(search_term).exec();
          questionnaire["desktop_network_questions"] = await DesktopNetworkQuestions.findOne(search_term).exec();
          questionnaire["email_questions"] = await EmailQuestions.findOne(search_term).exec();
          questionnaire["import_questions"] = await ImportQuestions.findOne(search_term).exec();
          questionnaire["connector_platform_questions"] = await ConnectorPlatformQuestions.findOne(search_term).exec();
          questionnaire["poc_questions"] = await POCQuestions.findOne(search_term).exec();
          questionnaire["rfe_questions"] = await RFEQuestions.findOne(search_term).exec();
          questionnaire["usage_questions"] = await UsageQuestions.findOne(search_term).exec();
          questionnaire["supervision_questions"] = await SupervisionQuestions.findOne(search_term).exec();
      }
      return questionnaire;
  }

  // Render and Display the Customer Details
  query({ "name": req.params.id }).then((result) => {
      if (result["customer"]) {
        res.render("show.ejs", {result, user: req.user})
      } else {
          console.log(getTimeStamp() + req.user.sAMAccountName + " attempted to access index/" + req.params.id )
          res.render('error.ejs', {message: "Cannot find this customer name", details: "Try finding a customer on the index page", user: req.user.sAMAccountName})
      }
  }).catch((error) => {
      console.log(error)
      res.render('error.ejs', {message: error, user: req.user.sAMAccountName})
  });
});


// ======================================================
// Version 1.3
// Display a Customer Details page
// ======================================================
app.get("/customer/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  console.log(getTimeStamp() + req.user.sAMAccountName + "is viewing " + req.params.id)
  Customer.findOne({name:req.params.id}, function (err, doc){
    if(err) {
      return res.send("Something went wrong")
    }
      // return res.send(doc)
      return res.render("customerdetail.ejs", {customer: doc, user: req.user})
  })
})


// ======================================================
// API Endpoint
// Return a list of connectors for a Customer
// GET
// Input: CustomerName
// Output: List of connectors 
// Example Output: [{type, users, licences, dailymessages}, {...}]
// ======================================================
app.get("/getConnectors/:id", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log(getTimeStamp() + req.user.sAMAccountName + " getConnectors: " + req.params.id)
  Customer.findOne({name:req.params.id}, {_id: 0, connectors: 1}, (err, doc) => {
    if(err) {
      console.log(err)
      
      return res.send("error")
    }
    return res.send(doc.connectors)
  })
})


// ======================================================
// API Endpoint
// Add Connector information for a customer
// POST
// Input: Type, TotalUsers, LicencedUsers, DailyMessages
// Output: Returns the newConnector ID or HTTP 500
// ======================================================
app.post("/addConnector/:id", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log(getTimeStamp() + req.user.sAMAccountName + " addConnector: " + req.params.id)
  const newConnector = req.body
  newConnector.id = mongoose.Types.ObjectId();
  Customer.findOneAndUpdate({name: req.params.id}, {$push: {connectors: newConnector}}, function (error, success) {
    if(error) {
      return res.sendStatus(500)
    }
    else {
      console.log(getTimeStamp() + req.user.sAMAccountName + " added a Connector to: " + req.params.id)
      console.log(newConnector)
      return res.send(newConnector.id)
    }
  })
})


// ======================================================
// API Endpoint
// Delete Connector information for a customer
// POST
// URL: CustomerName
// Input: Type, TotalUsers, LicencedUsers, DailyMessages
// Output: Response status code 200 or 500
// ======================================================
app.post('/delConnector/:id', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log(getTimeStamp() + req.user.sAMAccountName + " delConnector: " + req.params.id)
  console.log(req.body)
  Customer.update({name: req.params.id}, { $pull: { connectors: { id: new mongoose.Types.ObjectId(req.body.delConnectorID)} }}, function (error, success) {
    if(error) {
      console.log(error)
      return res.sendStatus(500)
    } else {
      console.log(getTimeStamp() + req.user.sAMAccountName + " deleted a Connector: " + req.body.delConnectorID)
      return res.sendStatus(200)
    }
  } )


  // userAccounts.update( 
  //   { userId: usr.userId },
  //   { $pull: { connections : { _id : connId } } },
  //   { safe: true },
  //   function removeConnectionsCB(err, obj) {
  //       ...
  //   });
  

}) 








// ======================================================
// Delete a customer profile
// ======================================================
app.delete("/index/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  console.log(getTimeStamp() + req.user.sAMAccountName + "Deleting customer " + req.params.id);

  async function delete_customer(search_term) {
      var refId = await Customer.findOne({ name: req.params.id });
      SizingQuestions.findOneAndRemove(search_term).exec();
      SizingQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      Customer.findOneAndRemove(search_term).exec();
      CustomerVersions.findOneAndRemove({ refId: refId }).exec();
      DesktopNetworkQuestions.findOneAndRemove(search_term).exec();
      DesktopNetworkQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      EmailQuestions.findOneAndRemove(search_term).exec();
      EmailQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      ImportQuestions.findOneAndRemove(search_term).exec();
      ImportQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      ConnectorPlatformQuestions.findOneAndRemove(search_term).exec();
      ConnectorPlatformQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      POCQuestions.findOneAndRemove(search_term).exec();
      POCQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      RFEQuestions.findOneAndRemove(search_term).exec();
      RFEQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      UsageQuestions.findOneAndRemove(search_term).exec();
      UsageQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
      SupervisionQuestions.findOneAndRemove(search_term).exec();
      SupervisionQuestionsVersions.findOneAndRemove({ refId: refId }).exec();
  }

  delete_customer({ "name": req.params.id }).then((result) => {
      res.redirect(append + "/index");
  }).catch((error) => {
      console.log(error);
      res.redirect(append + "/index");
  });
});


// =============================================
// Activity Report
// =============================================
app.get("/activity", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log(getTimeStamp() + req.user.sAMAccountName + " is displaying Activity Report page.")
  Customer.find().then((customers) => {
    return res.render("activity.ejs", { customers: customers, user: req.user })
  }).catch((error) => {
    console.log("An error has occurred for: " + req.user.sAMAccountName)
    console.log(error)
    return res.render("error.ejs", {error, user: req.user.sAMAccountName})
  })  
})

app.get("/activity/:days", connectEnsureLogin.ensureLoggedIn(), (req, res) => { 
  console.log(getTimeStamp() + req.user.sAMAccountName + " is displaying Activity Report page for " + req.params.days + " days.")
  // TO DO
  // Make sure that the date is an integer
  var theDate = moment().subtract(req.params.days, 'days')
  Customer.find(
    {
      updatedAt:{'$gte': theDate}
    }).then((customers) => {
      return res.render("activity.ejs", { customers: customers, user: req.user })
    }).catch( (error) => {
      console.log("An error has occurred.")
      console.log(error)
      return res.render("error.ejs", {error, user: req.user.sAMAccountName}) }
    )
})

// =============================================
// API Endpoint
// get a customer
// =============================================
app.post('/getCustomer', (req, res) => {
  console.log("Searching for customer: " + req.body.search)
  Customer.find({name: {$regex: req.body.search }}).then((result) => {
    console.log("Result Count: " + result.length)
    return res.send(result)
  }).catch((error) => {
    return res.send("no customer found")
  })
})




// =============================================
// Get Timestamp
// =============================================
function getTimeStamp() {
  const date = new Date();
  return '['+ date.getFullYear() + '-' +
      (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
      date.getDate().toString().padStart(2, '0') + ':' +
      date.getHours().toString().padStart(2, '0') + ':' +
      date.getMinutes().toString().padStart(2, '0') + ':' +
      date.getSeconds().toString().padStart(2, '0') + '] ';
}


// =============================================
// Export the router
// =============================================
module.exports = app 