// **************************************************
// /routes/other.js
// Other currently unused routes
// **************************************************

// prepends the base URL
var append = "";

var ldap_auth = require("ldapjs");

var {Customer} = require("../models/customer");
var {CustomerVersions} = require("../models/customer");
var {SizingQuestions} = require("../models/sizing");
var {SizingQuestionsVersions} = require("../models/sizing");
var {DesktopNetworkQuestions} = require("../models/desktop_network");
var {DesktopNetworkQuestionsVersions} = require("../models/desktop_network");
var {EmailQuestions} = require("../models/email");
var {EmailQuestionsVersions} = require("../models/email");
var {ConnectorPlatformQuestions} = require("../models/connector_platform");
var {ConnectorPlatformQuestionsVersions} = require("../models/connector_platform");
var {UsageQuestions} = require("../models/usage");
var {UsageQuestionsVersions} = require("../models/usage");
var {ImportQuestions} = require("../models/import");
var {ImportQuestionsVersions} = require("../models/import");
var {POCQuestions} = require("../models/poc");
var {POCQuestionsVersions} = require("../models/poc");
var {RFEQuestions} = require("../models/rfe");
var {RFEQuestionsVersions} = require("../models/rfe");
var {SupervisionQuestions} = require("../models/supervision");
var {SupervisionQuestionsVersions} = require("../models/supervision");
var User = require("../models/user");




// ======================================================
// Returns the Currently Logged in User
// ======================================================
router.get('/CurrentUser', (req, res) => {
  var user = req.session.user
  res.send({
    user
  })
})

// ======================================================
// Returns the Customer
// Need to perform login validation
// ======================================================
router.get('/getCustomer/:id', (req, res) => {
  console.log("Getting customer " + req.param.id)
    const customer = Customer.findOne({ name: req.params.id }, req.body.customer).exec();
    req.send(customer)
})


// ======================================================
// REGISTER
// ======================================================
router.get("/register", function (req, res) {
    res.render("register", {error_message: undefined});
});


// ======================================================
// POST REGISTER
// ======================================================
router.post("/register", function (req, res) {
    if (!req.body.registration_info["username"] || !req.body.registration_info["password"] || !req.body.registration_info["confirm_password"]) {
        res.render("register", {error_message: "Please enter all fields."});
    }
    // if (req.body.registration_info["code"] != process.env.CODE) {
    //   res.render("register", {error_message: "Code is incorrect."})
    // }
    else {
        if ((req.body.registration_info["password"] == req.body.registration_info["confirm_password"]) && (req.body.registration_info["code"] == process.env.CODE)) {
            async function register_user() {
                var hashed_password = await bcrypt.hash(req.body.registration_info["password"], 10);
                await User.create({username: req.body.registration_info["username"], password: hashed_password});
            }

            register_user().then(() => {
                res.redirect( append + "/login");
            }).catch((error) => {
                if (error["code"] == 11000) {
                    console.log("-- Duplicate entry for user: " + req.body.registration_info["username"]);
                    // Send pop up alert to HTML here
                    res.render("register", {error_message: "User already exists: " + req.body.registration_info["username"]});
                } else {
                    console.log(error);
                }
            });
        } else {
            res.render("register", {error_message: "Passwords are not equal."});
        }
    }
});





// ======================================================
// Import files for a customer
// ======================================================
router.post("/import/:id", authenticate_session, upload.single("file"), function (req, res) {
  //convert Excel spreadsheets to MongoDB data
  function convertData(collection, section) {
    collection.findOne({ name: req.params.id })
    .then(questions => {
      var content = fs.readFileSync(path.join(__dirname, "../models", `${section}.json`), 'utf8');
      var model = JSON.parse(content);
      mongoxlsx.xlsx2MongoData(`${section}.xlsx`, model, function(err, data) {
        if (err) {
          console.log(err);
        }
        else {
          data = data[0];
          data = _.omit(data, ["name"]);
          collection.findOneAndUpdate({ name: req.params.id }, data)
          .then(questions => {

          })
          .catch(e => {
            console.log(e);
          })
        }
      })
    })
    .catch(e => {
      console.log(e);
    })
  }

  //split one workbook with multiple worksheets into multiple workbooks
  function splitWorkbooks(collection, section) {
    XlsxPopulate.fromFileAsync(req.file.path)
    .then(workbook => {
      XlsxPopulate.fromBlankAsync()
      .then(newWorkbook => {
        var newSheet = newWorkbook.sheet(0);
        var usedRange = workbook.sheet(section).usedRange();
        var oldValues = usedRange.value();
        newSheet.range(usedRange.address()).value(oldValues);
        newWorkbook.toFileAsync(`${section}.xlsx`)
        .then(file => {
          convertData(collection, section);
        })
        .catch(e => {
          console.log(e);
        })
      })
      .catch(e => {
        console.log(e);
      })
    })
    .catch(e => {
      console.log(e);
    })
  }

  splitWorkbooks(Customer, "customer");
  splitWorkbooks(SizingQuestions, "sizing");
  splitWorkbooks(DesktopNetworkQuestions, "desktop_network");
  splitWorkbooks(EmailQuestions, "email");
  splitWorkbooks(ImportQuestions, "import");
  splitWorkbooks(ConnectorPlatformQuestions, "connector_platform");
  splitWorkbooks(POCQuestions, "poc");
  splitWorkbooks(RFEQuestions, "rfe");
  splitWorkbooks(UsageQuestions, "usage");
  splitWorkbooks(SupervisionQuestions, "supervision");

  res.redirect(`/index/${req.params.id}`);
})


// ======================================================
// Export Customer Data in Excel format
// ======================================================
router.post("/export/:id", authenticate_session, function (req, res) {
  //find MongoDB data
  async function query() {
    var data = {};
    data["customer"] = await Customer.find({ name: req.params.id }).exec();
    data["sizing"] = await SizingQuestions.find({ name: req.params.id }).exec();
    data["desktop_network"] = await DesktopNetworkQuestions.find({ name: req.params.id }).exec();
    data["email"] = await EmailQuestions.find({ name: req.params.id }).exec();
    data["import"] = await ImportQuestions.find({ name: req.params.id }).exec();
    data["connector_platform"] = await ConnectorPlatformQuestions.find({ name: req.params.id }).exec();
    data["poc"] = await POCQuestions.find({ name: req.params.id }).exec();
    data["rfe"] = await RFEQuestions.find({ name: req.params.id }).exec();
    data["usage"] = await UsageQuestions.find({ name: req.params.id }).exec();
    data["supervision"] = await SupervisionQuestions.find({ name: req.params.id }).exec();
    return data;
  }

  query()
  .then(data => {
    XlsxPopulate.fromBlankAsync()
    .then(newWorkbook => {
      var count = 0;

      //combine multiple workbooks into one workbook with multiple worksheets
      function combineWorkbooks(workbook1, workbook2, section) {
        var newSheet = workbook1.addSheet(section);
        var usedRange = workbook2.sheets()[0].usedRange();
        var oldValues = usedRange.value();
        newSheet.range(usedRange.address()).value(oldValues);
        count++;
        if (count == 10) {
          newWorkbook.deleteSheet("Sheet1");
          newWorkbook.moveSheet("customer", 0);
          newWorkbook.moveSheet("sizing", 1);
          newWorkbook.moveSheet("desktop_network", 2);
          newWorkbook.moveSheet("email", 3);
          newWorkbook.moveSheet("import", 4);
          newWorkbook.moveSheet("connector_platform", 5);
          newWorkbook.moveSheet("poc", 6);
          newWorkbook.moveSheet("rfe", 7);
          newWorkbook.moveSheet("usage", 8);
          newWorkbook.moveSheet("supervision", 9);
          newWorkbook.toFileAsync(`${req.params.id}.xlsx`)
          .then(file => {
            res.download(`${req.params.id}.xlsx`);
          })
          .catch(e => {
            console.log(e);
          })
        }
      }

      //convert MongoDB data to Excel spreadsheets
      function convertData(section) {
        if (section == "customer") {
          data[section][0] = _.omit(data[section][0].toObject(), ["_id", "__v", "createdAt", "updatedAt", "createdBy", "updatedBy"]);
        }
        else {
          data[section][0] = _.omit(data[section][0].toObject(), ["_id", "__v"]);
        }
        var content = fs.readFileSync(path.join(__dirname, "../models", `${section}.json`), 'utf8');
        var model = JSON.parse(content);
        mongoxlsx.mongoData2Xlsx(data[section], model, function(err, data) {
          if (err) {
            console.log(err);
          }
          else {
            XlsxPopulate.fromFileAsync(data.fullPath)
            .then(workbook => {
              combineWorkbooks(newWorkbook, workbook, section);
            })
            .catch(e => {
              console.log(e);
            })
          }
        })
      }

      convertData("customer");
      convertData("sizing");
      convertData("desktop_network");
      convertData("email");
      convertData("import");
      convertData("connector_platform");
      convertData("poc");
      convertData("rfe");
      convertData("usage");
      convertData("supervision");
    })
    .catch(e => {
      console.log(e);
    })
  })
  .catch(e => {
    console.log(e);
  })
})


// ======================================================
// Get Customer History
// ======================================================
router.get("/history/:id", authenticate_session, function (req, res) {
  Customer.findOne({ name: req.params.id })
  .then(customer => {
    CustomerVersions.findOne({ refId: customer._id })
    .then(version => {
      res.render("history", {versions: version.versions});
    })
    .catch(e => {
      console.log(e);
    })
  })
  .catch(e => {
    console.log(e);
  })
});


// ======================================================
// Get Customer History
// ======================================================
router.get("/history/:id/:version", authenticate_session, function (req, res) {
  async function query() {
    var questionnaire = {};
    var refId = await Customer.findOne({ name: req.params.id });
    if (refId) {
      questionnaire["sizing_questions"] = await SizingQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["customer"] = await CustomerVersions.findOne({ refId: refId }).exec();
      questionnaire["desktop_network_questions"] = await DesktopNetworkQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["email_questions"] = await EmailQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["import_questions"] = await ImportQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["connector_platform_questions"] = await ConnectorPlatformQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["poc_questions"] = await POCQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["rfe_questions"] = await RFEQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["usage_questions"] = await UsageQuestionsVersions.findOne({ refId: refId }).exec();
      questionnaire["supervision_questions"] = await SupervisionQuestionsVersions.findOne({ refId: refId }).exec();
      return questionnaire;
    }
  }

  query()
  .then(result => {
    for (var questions in result) {
      result[questions] = result[questions].versions[req.params.version];
    }
    result["version"] = req.params.version;
    res.render("show_history", result);
  })
  .catch(e => {
    console.log(e);
  })
});

module.exports = router;