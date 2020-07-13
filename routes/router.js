// **************************************************
// /routes/router.js
// Provides basic routing for the app
// **************************************************

const fs                      = require('fs')
const express                 = require('express')
const app                     = new express.Router()
const connectEnsureLogin      = require('connect-ensure-login')
const passport                = require('passport')
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


// append is the base URL
var append = "";

// ==================================================
// Passport LDAP Strategy
// ==================================================
passport.serializeUser(function(user, done) {
  console.log("[+] Serialize User: " + user.sAMAccountName)
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  // all the user info is currently stored in the "id" in the session
  // The session info is stored in the Mongo DB
  console.log("[+] De-Serialize User: " + user.sAMAccountName)
  return done(null, user);
});
var LdapStrategy = require('passport-ldapauth')
var OPTS = {
  server: {
    url: process.env.LDAP_URL,
    bindDN: process.env.LDAP_bindDN,
    bindCredentials: process.env.LDAP_bindCredentials,
    searchBase: process.env.LDAP_searchBase,
    searchFilter: process.env.LDAP_searchFilter,
    tlsOptions: {
      ca: [
        fs.readFileSync('./certs/ProofpointCorporateRootCA.crt'),
        fs.readFileSync('./certs/ProofpointCorporateSub-OrdinateCA.crt')
      ]
    }
  }
}
passport.use(new LdapStrategy(OPTS))


// ==================================================
// Display Customers where the current user is listed on the account
// ==================================================
app.get("/", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log("[+] Displaying MyCustomers page for: " + req.user.sAMAccountName)
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
    console.log("[+] " + req.user.sAMAccountName + " is already logged in.")
    return res.redirect("/")
  }
  console.log("[+] Displaying the login page.")
  res.render('login.ejs')
})


// ==================================================
// Process the Login Form
// ==================================================
app.post('/login', passport.authenticate('ldapauth', {session: true, failureRedirect: '/'}), function(req, res) {
  console.log("[+] Login: " + req.user.sAMAccountName)
  return res.redirect('/');
})


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
    console.log("[+] Logout: " + req.session.passport.user.sAMAccountName)
    try {
      req.logout()
      req.session.destroy()
    }
    catch (e) {
      console.log("[-] Logout Error: " + e)
    }
    // double check
    if(typeof req.session === 'undefined') {
      console.log("[+] The user is logged out.")
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
      console.log("[+] Trying to create new customer...");

      Customer.create(req.body.customer)
      .then(customer => {
        //update the created by field and the updated by field
        customer.createdBy = req.session.user;
        customer.updatedBy = req.session.user;
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
        console.log("[+] Created customer '" + req.body.customer["name"]);
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
      console.log("[+] Attempting to update General questions for: " + req.params.id);
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
          console.log("[+] Updated: " + req.params.id);
      }

      // Redirect
      updateID().then(() => {
          Customer.findOne({ name: req.params.id })
          .then(customer => {
            customer.updatedBy = req.session.user;
            customer.save();
          })
          .catch(e => {
            console.log(e);
          })
          res.redirect("/index/" + encodeURIComponent(req.body.customer["name"]));
      }).catch((error) => {
          console.log(error);
          if (error["code"] == 11000) { // Dupe ID
              console.log("[+] Duplicate key for customer: " + req.body.customer["name"]);
              res.status(409);
              res.send("This customer name already exists.");
          } else {
              console.log(error.error_message + "\n---");
          }
      });
  }

    // Updating sizing questions
    if (req.body.sizing_questions != undefined && req.body.sizing_questions != null) {
        console.log("[+] Attempting to update Sizing Questions...");
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
        console.log("[+] Attempting to update Desktop Network Questions...");
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
        console.log("[+] Attempting to update Email Systems Questions...");
        EmailQuestions.findOneAndUpdate({ "name": req.params.id }, req.body.email_questions).then(() => {
            //res.redirect( append + "/index/" + encodeURIComponent(req.params.id));
            // console.log(req.body.email_questions);
            console.log("[+] Updated Email Systems Questions.");
            updateVersions({ name: req.body.email_questions["name"] });
            // res.status(200).json("{}");
        }).catch((error) => {
            console.log(error);
            res.redirect(append + "/index");
        });
    }

    // Updating Import Questions
    if (req.body.import_questions != undefined && req.body.import_questions != null) {
        console.log("[+] Attempting to update Import information...");
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
        console.log("[+] Update - Connector Platform - " + req.params.id);
        name = "connector_platform_questions[facebook_number_of_users]"
        
        // Need to determine if each HTML Checkbox is "on" or "undefined"
        const connector_platform_chk_box_names = ["facebook", "linkedin", "twitter", "google", "youtube", "files", "skype_in_cloud", "skype_on_prem", "lync_on_prem", "one_drive", "box", "bloomberg", "yammer", "jive", "chatter", "slack", "symphony", "teams", "sharepoint"];
        connector_platform_chk_box_names.forEach(function(chk_box_name){
          let checkedValue = req.body.connector_platform_questions[chk_box_name];
            if(checkedValue) { 
              // Runs if the box is not undefined
              // console.log("[+] The " + chk_box_name + " box was checked")
          } else { 
            // console.log("[+] The " + chk_box_name + " box was NOT checked")
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
        console.log("[+] Attempting to update POC information...");
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
        console.log("[+] Attempting to update RFE information...");
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
        console.log("[+] Attempting to update Usage Questions...");
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
        console.log("[+] Attempting to update Finserv Supervision Questions...");
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
        res.render("show", {result, user: req.user})
      } else {
          res.redirect("/")
      }
  }).catch((error) => {
      console.log(error)
      res.redirect("/")
  });
});


// ======================================================
// Version 1.3
// Display a Customer Details page
// ======================================================
app.get("/customer/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  console.log("[+] " + req.user.sAMAccountName + " is viewing " + req.params.id)
  Customer.findOne({name:req.params.id}, function (err, doc){
    if(err) {
      return res.send("Something went wrong")
    }
      // return res.send(doc)
      return res.render("customerdetail.ejs", {customer: doc, user: req.user})
  })
})


// ======================================================
// Version 1.3
// Update a Customer Profile
// ======================================================
app.post("/customer/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) { 
  res.send("It works")
})


// ======================================================
// Delete a customer profile
// ======================================================
app.delete("/index/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  console.log("[+] " + req.user.sAMAccountName + "Deleting customer " + req.params.id);

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
// Export the router
// =============================================
module.exports = app 