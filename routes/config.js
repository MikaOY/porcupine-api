// @ts-nocheck

let Connection = require('tedious').Connection
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
let connectionSetup = new Connection(config);
connectionSetup.on('connect', function (err) {
	if (err) {
		console.log(err);
	} else {
		// If no error, then good to proceed.
		console.log("Connected");
	}
});
// export connection
Object.defineProperty(exports, '__esModule', {
 value: true
});
exports.connection = connectionSetup;

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

// 'global' methods
exports.generatePUT = generatePUT;
function generatePUT(table) {
	return function (req, res) {
		let userId = req.body.userId;
		let sql;

		switch (table) {
			case 'board': {
				let boardId = req.body.boardId;

				let boardTitle = req.body.title;
				let boardDateCreated = req.body.dateCreated;

				// Generate SQL query, adjusted for different number of defined URL params
				sql = `UPDATE ${table}
							SET ${boardTitle == undefined ? '' : ('board_title = ' + boardTitle)}${boardDateCreated !== undefined ? ', ' : ''}
								${boardDateCreated == undefined ? '' : ('board_date_created = ' + boardDateCreated)}
							WHERE person_id_board = ${userId} AND board_id = ${boardId}`;
				break;
			}
			case 'category': {
				let categoryId = req.body.categoryId;

				let catTitle = req.body.title;
				let catBoardId = req.body.boardId;
				let color = req.body.color;
				let catDateCreated = req.body.dateCreated;
				let priorityValue = req.body.priorityVal;

				// Generate SQL query, adjusted for different number of defined URL params
				sql = `UPDATE ${table}
							SET ${catTitle == undefined ? '' : ('category_title = ' + catTitle)}${catBoardId !== undefined ? ', ' : ''}
								${catBoardId == undefined ? '' : ('board_id_category = ' + catBoardId)}${color !== undefined ? ', ' : ''}
								${color == undefined ? '' : ('color = ' + color)}${catDateCreated !== undefined ? ', ' : ''}
								${catDateCreated == undefined ? '' : ('category_date_created = ' + catDateCreated)}${priorityValue !== undefined ? ', ' : ''}
								${priorityValue == undefined ? '' : ('category_priority = ' + priorityValue)}
							WHERE person_id_category = ${userId} AND category_id = ${categoryId}`;
				break;
			}
			case 'todo': {
				let todoId = req.body.todoId;

				let info = req.body.info;
				let todoCategoryId = req.body.categoryId;
				let priorityVal = req.body.priorityVal;
				let todoDateCreated = req.body.dateCreated;
				let isDone = req.body.isDone;
				let dateDone = req.body.dateDone;
				let isArchived = req.body.isArchived;
				let todoDateDue = req.body.dateDue;

				// Generate SQL query, adjusted for different number of defined URL params
				sql = `UPDATE ${table}
							SET ${info == undefined ? '' : ('todo_info = ' + info)}${todoCategoryId !== undefined ? ', ' : ''}
								${todoCategoryId == undefined ? '' : ('category_id_todo = ' + todoCategoryId)}${priorityVal !== undefined ? ', ' : ''}
								${priorityVal == undefined ? '' : ('todo_priority = ' + priorityVal)}${todoDateCreated !== undefined ? ', ' : ''}
								${todoDateCreated == undefined ? '' : ('todo_date_created = ' + todoDateCreated)}${isDone !== undefined ? ', ' : ''}
								${isDone == undefined ? '' : ('is_done = ' + isDone)}${dateDone !== undefined ? ', ' : ''}
								${dateDone == undefined ? '' : ('date_done = ' + dateDone)}${isArchived !== undefined ? ', ' : ''}
								${isArchived == undefined ? '' : ('is_archived = ' + isArchived)}${todoDateDue !== undefined ? ', ' : ''}
								${todoDateDue == undefined ? '' : ('date_due = ' + todoDateDue)}
							WHERE person_id_todo = ${userId} AND todo_id = ${todoId}`;
				break;
			}
			case 'person': {
				let personId = req.body.personId;

				let fName = req.body.fname;
				let lName = req.body.lname;
				let username = req.body.username;
				let email = req.body.email;
				let hash = req.body.hash;

				// Generate SQL query, adjusted for different number of defined URL params
				sql = `UPDATE ${table}
							VALUES (fname, lname, username, person_email, password_hash)
							SET ${fName == undefined ? '' : ('fname = ' + fName)}${lName !== undefined ? ', ' : ''}
								${lName == undefined ? '' : ('lname = ' + lName)}${username !== undefined ? ', ' : ''}
								${username == undefined ? '' : ('username = ' + username)}${email !== undefined ? ', ' : ''}
								${email == undefined ? '' : ('person_email = ' + email)}${hash !== undefined ? ', ' : ''}
								${hash == undefined ? '' : ('password_hash = ' + hash)}
							WHERE person_id = ${personId};`
				break;
			}
		}

		let request = new Request(sql, function (err, rowCount) {
			if (err) {
				console.log(err);
			}
			console.log(rowCount + ' row(s) inserted');
		}
		);

		request.on('doneInProc', function (rowCount) {
			console.log(rowCount + ' rows affected');
			res.end('Holy macaroni. It worked!');
		});

		_config.connection.execSql(request);
	}
}
