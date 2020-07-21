// =============================================
// File Model
// Used to keep track of the GridFS File ID
// =============================================

var mongoose = require('mongoose')
var customerfile_schema = new mongoose.Schema({
    fileID: {
        type: String,
        unique: true,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    customerID: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: String,
        required: true
    }
},
{
    timestamps: true
})

var Customerfile = mongoose.model("CustomerFile", customerfile_schema);
module.exports = Customerfile;