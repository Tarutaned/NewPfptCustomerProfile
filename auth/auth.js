const passport                = require('passport')
const fs                      = require('fs')

// ==================================================
// Passport LDAP Strategy
// ==================================================
passport.serializeUser(function(user, done) {
    // console.log(getTimeStamp() + "Serialize User: " + user.sAMAccountName)
    done(null, user);
  });
  passport.deserializeUser(function(user, done) {
    // all the user info is currently stored in the "id" in the session
    // The session info is stored in the Mongo DB
    // console.log(getTimeStamp() + "De-Serialize User: " + user.sAMAccountName)
    return done(null, user);
  });
  var LdapStrategy = require('passport-ldapauth')
  const { nextTick } = require('process')
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
      },
      passReqToCallback: true,
    }
  }
  passport.use(new LdapStrategy(OPTS, function(user, done) {
    console.log("[+] Login " + user.sAMAccountName)
    if (!user) {
      return done(null, false, {message: 'Unable to login!'})
    }
    return done(null, user)
  }))

  
module.exports = passport