var mongoose = require("mongoose");

var email_schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    exchange_details: {
      journaling_location: {
          type: String,
          default: ""
      },
      users_per_location: {
          type: String,
          default: ""
      },
      exchange_version: {
          type: String,
          default: ""
      },
      number_of_mail_servers: {
          type: String,
          default: ""
      },
      has_enterprise_CAL: {
          type: String,
          default: ""
      },
      is_replicating_exchange_and_AD: {
          type: String,
          default: ""
      },
      number_of_inboxes: {
          type: String,
          default: ""
      },
      is_journal_in_own_DB: {
          type: String,
          default: ""
      },
      number_of_extra_storage: {
          type: String,
          default: ""
      },
      is_using_RMS: {
          type: String,
          default: ""
      },
      is_journal_decryption_enabled: {
          type: String,
          default: ""
      },
      journal_rules: {
          type: String,
          default: ""
      },
    },
    active_directory_details: {
        number_of_forests: {
            type: String,
            default: "0"
        },
        is_using_multi_domains: {
            type: String,
            default: "0"
        },
        structure: {
            type: String,
            default: "0"
        },
        ad_objects: {
            type: String,
            default: "0"
        }
    },
    O365_details: {
      AD_size: {
          type: String,
          default: ""
      },
      O365_version: {
          type: String,
          default: ""
      },
      is_maintaining_on_prem_AD: {
          type: String,
          default: ""
      },
      is_maintaining_azure: {
          type: String,
          default: ""
      },
      is_admin_in_AD_or_azure: {
          type: String,
          default: ""
      },
    },
    comments: {
        type: String,
        default: ""
    }
});
var email_versions_schema = new mongoose.Schema({
  refId: mongoose.Schema.Types.ObjectId,
  versions: [email_schema]
});

var EmailQuestions = mongoose.model("EmailQuestions", email_schema);
var EmailQuestionsVersions = mongoose.model("EmailQuestionsVersions", email_versions_schema);

module.exports = {EmailQuestions, EmailQuestionsVersions};
