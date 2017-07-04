// @ts-nocheck
let express = require('express');
let router = express.Router();

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

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

// protecting endpoint example: only access token with scope 'read:messages' can access
/*
const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get('/api/private', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
  });
});
*/

router.use(checkJwt);

// ROUTES

// home page
router.get('/', function (req, res) {
	res.render('index', { title: 'Porcupine' });
});

/* Restore all */
router.put('/restore/all', function (req, res) {
	console.log('PUT delete received');

	// Generate query based on table
	let sql = `with prod as (select * from board)
						update prod set board_is_deleted = 0;
						with prod as (select * from category)
						update prod set category_is_deleted = 0;
						with prod as (select * from todo)
						update prod set todo_is_deleted = 0;`

	let request = new Request(sql, function (err, rowCount) {
		if (err) {
			console.log(err);
		}
		console.log(rowCount + ' row(s) inserted');
	}
	);

	request.on('doneInProc', function (rowCount) {
		console.log(rowCount + ' rows affected');
		console.log('It worked!');
		res.end('Holy macaroni. It worked!');
	});

	connection.execSql(request);
});

/* Board */

// GET all by user
// URL params: userId
router.get('/board', generateGET('board', 'userId'));

// POST new board
// body params: userId, board_title, dateCreated
router.post('/board', generatePOST('board'));

// PUT board
// body: userId, boardId, board_title, dateCreated
// MUST send board_title, userId, boardId
router.put('/board', generatePUT('board'));

// PUT (delete) board
// body MUST: boardId, userId
router.put('/board/delete', generatePUTDelete('board', '1'));
// restore
router.put('/board/restore', generatePUTDelete('board', '0'));

// DELETE board with id
// URL params: boardId
router.delete('/board', generateDELETE('board', 'boardId'));

/* Category */
// GET
router.get('/category', generateGET('category', 'userId'));

// POST new category
// body params: userId, category_title, color, defaultOrder, priorityVal, dateCreated, boardId
router.post('/category', generatePOST('category'));

// PUT cat
// body: userId, categoryId, info, categoryId, priorityVal, isDone (0/1), dateDone, isArchived (0/1)
// MUST send category_title, userId, categoryId
router.put('/category', generatePUT('category'));

// PUT (delete) category
// body MUST: categoryId, userId
router.put('/category/delete', generatePUTDelete('category', '1'));
// restore
router.put('/category/restore', generatePUTDelete('category', '0'));

// DELETE category with id
// URL params: categoryId
router.delete('/category', generateDELETE('category', 'categoryId'));

/* Priority

// GET
router.get('/priority', generateGET('priority', 'userId'));

// POST new priority
// URL params: userId, importance, name
router.post('/priority', generatePOST('priority'));

// DELETE priority with id
// URL params: priorityId
router.delete('/priority', generateDELETE('priority', 'priorityId'));

*/

/* Todo */

// GET all by user
// URL params: userId
router.get('/todo', generateGET('todo', 'userId'));

// POST new todo
// body params: userId, info, categoryId, dateCreated, isDone (0/1), dateDone, isArchived, priorityVal, dateDue
router.post('/todo', generatePOST('todo'));

// PUT todo
// body: userId, todoId, info, categoryId, isDone (0/1), dateDone, isArchived (0/1), priorityVal, dateDue
// MUST send info, userId, todoId
router.put('/todo', generatePUT('todo'));

// PUT (delete) todo
// body MUST: todoId, userId
router.put('/todo/delete', generatePUTDelete('todo', '1'));
// restore
router.put('/todo/restore', generatePUTDelete('todo', '0'));

// DELETE todo with id
// URL params: todoId
router.delete('/todo', generateDELETE('todo', 'todoId'));

/* USER */

// GET user by email/ authOId
// URL params: email/ authOId
router.get('/user', (req, res) => {
	console.log('GET user by email/id received');

	// Generate query based on param
	let sql;
	if (req.query['email'] != undefined) {
		sql = `SELECT * FROM person
						WHERE person_email like '${req.query['email']}';`
	}
	if (req.query['authOId'] != undefined) {
		sql = `SELECT * FROM person
						WHERE autho_id like '${req.query['authOId']}';`
	}
	console.log(sql);

	let request = new Request(sql, function (err) {
		if (err) {
			console.log(err);
		}
	});

	// Build array of json objects to return
	let jsonArray = [];
	request.on('row', function (columns) {
		let rowObject = {};
		columns.forEach(function (column) {
			rowObject[column.metadata.colName] = column.value;
		});
		jsonArray.push(rowObject)
	});

	request.on('doneInProc', function (rowCount) {
		console.log(rowCount + ' rows returned');
		res.status(200).json(jsonArray);
		res.end('Holy macaroni. It worked!');
	});

	connection.execSql(request);
});

// PUT user
// body params: fname, lname, username, email, hash
router.put('/user', generatePUT('person'));

/* SHARING */

// POST new sharing
// body params: boardId, recipientId, isViewOnly, note, sharerId, ownerId, recipientEmail
router.post('/shared', (req, res) => {
	console.log('POST sharing received');

	let sql = `INSERT INTO sharing
							VALUES (${req.body.boardId}, ${req.body.recipientId}, ${req.body.isViewOnly},
								${req.body.note}, ${req.body.sharerId}, ${req.body.ownerId})`;

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

	connection.execSql(request);
});

// GET all by user/ board
// URL params: userId/ boardId
router.get('/shared', (req, res) => {
	console.log('GET shared received');

	// Generate query based on params
	let sql;
	if (req.query['boardId'] != undefined) {
		sql = `SELECT * FROM sharing
						INNER JOIN person
							ON sharing.person_id_sharing = person.person_id
						WHERE sharing.board_id_sharing = ${req.query['boardId']};`
	}
	if (req.query['userId'] != undefined) {
		sql = `SELECT * FROM sharing
						INNER JOIN board ON sharing.board_id_sharing = board.board_id
						INNER JOIN category ON board.board_id = category.board_id_category
						INNER JOIN todo ON category.category_id = todo.category_id_todo
						WHERE sharing.person_id_sharing = ${req.query['userId']};`
	}

	let request = new Request(sql, function (err) {
		if (err) {
			console.log(err);
		}
	});

	// Build array of json objects to return
	let jsonArray = [];
	request.on('row', function (columns) {
		let rowObject = {};
		columns.forEach(function (column) {
			rowObject[column.metadata.colName] = column.value;
		});
		jsonArray.push(rowObject)
	});

	request.on('doneInProc', function (rowCount) {
		console.log(rowCount + ' rows returned');
		res.status(200).json(jsonArray);
		res.end('Holy macaroni. It worked!');
	});

	connection.execSql(request);
});

// DELETE sharing
// URL params: boardId, recipientId, userId
router.delete('/shared', (req, res) => {
	console.log('DELETE sharing received');

	let sql = `DELETE FROM sharing
							WHERE board_id_sharing = ${req.query['boardId']}
								AND person_id_sharing = ${req.query['recipientId']}
								AND (sharer_id = ${req.query['userId']} OR owner_id = ${req.query['userId']} OR is_view_only = 0);`;

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

	connection.execSql(request);
});

function generatePOST(table) {
	return function (req, res) {
		console.log('POST received');

		// Set query based on table
		let sql;
		switch (table) {
			case 'board':
				sql = `INSERT INTO board (person_id_board, board_title, board_date_created, board_is_deleted)
                        VALUES (${req.body.userId}, ${req.body.title}, ${req.body.dateCreated}, 0);`;
				break;
			case 'category':
				sql = `INSERT INTO category (person_id_category, category_title, color, category_priority, category_date_created, board_id_category, category_is_deleted)
                        VALUES (${req.body.userId}, ${req.body.title}, ${req.body.color},
                        ${req.body.priorityVal}, ${req.body.dateCreated}, ${req.body.boardId}, 0);`;
				break;
			/*
			case 'priority':
				sql = `INSERT INTO priority (person_id, importance, name)
                        VALUES (${req.body.userId}, ${req.body.importance}, ${req.body.name});`;
				break;
			*/
			case 'todo':
				sql = `INSERT INTO todo (person_id_todo, todo_info, category_id_todo, todo_date_created, is_done, date_done, is_archived, todo_priority, date_due, todo_is_deleted)
                        VALUES (${req.body.userId}, ${req.body.info}, ${req.body.categoryId}, ${req.body.dateCreated},
                        ${req.body.isDone}, ${req.body.dateDone}, ${req.body.isArchived}, ${req.body.priorityVal}, ${req.body.dateDue}, 0);`;
				break;
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

		connection.execSql(request);
	};
}

function generateGET(table, matchParam) {
	return function (req, res) {
		console.log('GET received');

		// Generate query based on table
		let sql;
		if (table) {
			sql = `SELECT * FROM ${table} WHERE person_id_${table} = ${req.query[matchParam]} AND ${table}_is_deleted = 0;`;
		} else {
			sql = null;
		}

		let request = new Request(sql, function (err) {
			if (err) {
				console.log(err);
			}
		});

		// Build array of json objects to return
		let jsonArray = [];
		request.on('row', function (columns) {
			let rowObject = {};
			columns.forEach(function (column) {
				rowObject[column.metadata.colName] = column.value;
			});
			jsonArray.push(rowObject)
		});

		request.on('doneInProc', function (rowCount) {
			console.log(rowCount + ' rows returned');
			res.status(200).json(jsonArray);
			res.end('Holy macaroni. It worked!');
		});

		connection.execSql(request);
	};
}

function generatePUT(table) {
	return function (req, res) {
		let userId = req.body.userId;
		let sql;

		switch (table) {
			case 'board':
				let boardId = req.body.boardId;

				let boardTitle = req.body.title;
				let boardDateCreated = req.body.dateCreated;

				// Generate SQL query, adjusted for different number of defined URL params
				sql = `UPDATE ${table}
							SET ${boardTitle == undefined ? '' : ('board_title = ' + boardTitle)}${boardDateCreated !== undefined ? ', ' : ''}
								${boardDateCreated == undefined ? '' : ('board_date_created = ' + boardDateCreated)}
							WHERE person_id_board = ${userId} AND board_id = ${boardId}`;
				break;
			case 'category':
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
			case 'todo':
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
			case 'person':
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

		connection.execSql(request);
	}
}

function generatePUTDelete(table, bit) {
	return function (req, res) {
		console.log('PUT delete received');

		// Generate query based on table
		let sql;
		if (table) {
			sql = `UPDATE ${table} SET ${table}_is_deleted = ${bit}
							WHERE person_id_${table} = ${req.body.userId} AND ${table}_id = ${req.body[table + 'Id']};`;
		} else {
			sql = null; // TODO: return error
		}
		// delete todos with cat
		if (table == 'category') {
			let newSql = `UPDATE todo SET todo_is_deleted = ${bit}
											WHERE category_id_todo = ${req.body[table + 'Id']};` + sql;
			sql = newSql;
		}
		// delete cats under board, and board under cats
		if (table == 'board') {
			sql = `with prod as (
							select * from board
								inner join category on board.board_id = category.board_id_category
								inner join todo on category.category_id = todo.category_id_todo
							where board.board_id = ${req.body[table + 'Id']})
						update prod set board_is_deleted = ${bit};
						with prod as (
							select * from board
								inner join category on board.board_id = category.board_id_category
								inner join todo on category.category_id = todo.category_id_todo
							where board.board_id = ${req.body[table + 'Id']})
						update prod set category_is_deleted = ${bit};
						with prod as (
							select * from board
								inner join category on board.board_id = category.board_id_category
								inner join todo on category.category_id = todo.category_id_todo
							where board.board_id = ${req.body[table + 'Id']})
						update prod set todo_is_deleted = ${bit};`
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
			console.log('It worked!');
			res.end('Holy macaroni. It worked!');
		});

		connection.execSql(request);
	};
}

function generateDELETE(table, param) {
	return function (req, res) {
		console.log('DELETE received');
		console.log(param);

		// Set query based on table
		let sql = `DELETE FROM ${table} WHERE ${table}_id = ${req.query[param]};`;
		console.log(sql);

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

		connection.execSql(request);
	};
}

module.exports = router;
module.exports.generatePOST = generatePOST;
module.exports.generatePUT = generatePUT;
