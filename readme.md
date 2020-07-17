# Sales App
Proofpoint Sales Website to track new clients.

### Requirements
1. Docker
2. A Mongo Database

### Deploy in Production
1. Clone the code from the git repo.
   * `git clone https://github.com/nikko0327/NewPfptCustomerProfile.git`
2. Create and edit a .env file
   * `nano .env`
   * ```
   PORT=81
   MONGO_DB_URL='mongodb://yourMongoServer:27018/NewCustomerProfile'
   JWT_SECRET='aVeryLongStringOfRandomCharacters'
   LDAP_URL='ldaps://company.com:636'
   LDAP_bindDN='user@company.com'
   LDAP_bindCredentials='passowrd'
   LDAP_searchBase='DC=company,DC=com'
   LDAP_searchFilter='(sAMAccountName={{username}})'
   ```
3. Build the Docker container
   * `sudo docker build -t acp:1.7 .`
4. Run the Docker container
   * `sudo docker run -d -p 80:81 --name acp acp:1.7

