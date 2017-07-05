// @ts-nocheck

var Connection = require('tedious').Connection;
// Create connection to database
let config = {
	userName: 'MikaY',
	password: 'ILoveCodingPorcupine2017',
	server: 'testing-mika.database.windows.net',
	options: {
		database: 'porcupine-db',
		encrypt: true,
	}
}
let connection = new Connection(config);
connection.on('connect', function (err) {
	if (err) {
		console.log(err);
	} else {
		// If no error, then good to proceed.
		console.log("Connected");
	}
});

// AuthO JWT validation
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');

// Authentication middleware. When used, the
// access token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
	// Dynamically provide a signing key
	// based on the kid in the header and
	// the singing keys provided by the JWKS endpoint.
	secret: jwksRsa.expressJwtSecret({
		cache: true,
		rateLimit: true,
		jwksRequestsPerMinute: 5,
		jwksUri: `https://porcupine.au.auth0.com/.well-known/jwks.json`
	}),

	// Validate the audience and the issuer.
	audience: 'http://porcupine-dope-api.azurewebsites.net',
	issuer: `https://porcupine.au.auth0.com/`,
	algorithms: ['RS256']
});

/* protecting endpoint example: only access token with scope 'read:messages' can access
const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get('/api/private', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
  });
});
*/

let express = require('express');
let router = express.Router();
//router.use(checkJwt);

module.exports = router;
module.exports = connection;
