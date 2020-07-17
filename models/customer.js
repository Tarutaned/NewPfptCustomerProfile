var mongoose = require("mongoose");

var CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    salesRep: {
        type: String,
        default: ""
    },
    archivingSe: {
        type: String,
        default: ""
    },
    accManager: {
        type: String,
        default: ""
    },
    tpm: {
        type: String,
        default: ""
    },
    tam: {
        type: String,
        default: ""
    },
    solutionArchitect: {
        type: String,
        default: ""
    },
    supervisionConsultant: {
        type: String,
        default: ""
    },
    numberOfMailboxes: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: ""
    },
    natIp: {
        type: String,
        default: ""
    },
    incumbentSolution: {
        type: String,
        default: ""
    },
    existing_archive_prospect: {
        type: Boolean,
        default: false
    },
    existing_archive_customer: {
        type: Boolean,
        default: false
    },
    existing_security_customer: {
        type: Boolean,
        default: false
    },
    pso: {
        ticket: {
            type: String,
            default: ""
        },
        location: {
            type: String,
            default: "Salesforce"
        }
    },
    interest: {
        archiving: {
            type: String,
            default: "No"
        },
        ediscovery: {
            type: String,
            default: "No"
        },
        analytics: {
            type: String,
            default: "No"
        },
        supervision: {
            type: String,
            default: "No"
        },
        connectors: {
            type: String,
            default: "No"
        },
        uat: {
            type: String,
            default: "No"
        },
        imports: {
            type: String,
            default: "No"
        },
        pcgm: {
            type: String,
            default: "No"
        },
    },
    shipreq: {
        type: String,
        default: ""
    },
    ps_opportunity: {
      type: String,
      default: ""
    },
    messaging_system: {
      type: String,
      default: ""
    },
    hybrid_or_hosted: {
      type: String,
      default: ""
    },
    virtual_or_physical: {
      type: String,
      default: ""
    },
    contacts: [],
    comments: {
        type: String,
        default: ""
    },
    createdBy: {
      type: String,
      default: ""
    },
    updatedBy: {
      type: String,
      default: ""
    }
},
{
  timestamps: true
});
var CustomerVersionsSchema = new mongoose.Schema({
  refId: mongoose.Schema.Types.ObjectId,
  versions: [CustomerSchema]
});

var Customer = mongoose.model("Customer", CustomerSchema);
var CustomerVersions = mongoose.model("CustomerVersions", CustomerVersionsSchema);

// Customer.create({
//     name: "Kearney",
//     status: "OLD",
//     salesRep: "1One",
//     archivingSe: "2Two",
//     accManager: "3Three",
//     location: "4Four",
//     supervision: "5Five",
//     natIp: "6Six",
//     contacts: "7Seven"
// });
//
// var newCustomer = new Customer({
//     _id: "Tesla"
// });
//
// newCustomer.save(function (error, result) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log("Successfully created customer: " + result["_id"]);
//     }
// });

module.exports = {Customer, CustomerVersions};
