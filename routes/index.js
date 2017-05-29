let express = require('express');
let router = express.Router();

let Connection = require('tedious').Connection;
let Request = require('tedious').Request;

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

// ROUTES

// home page
router.get('/', function (req, res) {
	res.render('index', { title: 'Porcupine' });
});

/* Board */

// GET all by user
// params: personId
router.get('/board', generateGET('board', 'personId'));

// POST new board
// params: personId, title, dateCreated
router.post('/board', generatePOST('board'));

// DELETE board with id
// params: boardId
router.delete('/board', generateDELETE('board', 'boardId'));

/* Category */

// GET  
router.get('/category', generateGET('category', 'personId'));

// POST new category
// params: personId, title, color, defaultOrder, priorityValue, dateCreated, boardId
router.post('/category', generatePOST('category'));

// DELETE category with id
// params: categoryId
router.delete('/category', generateDELETE('category', 'categoryId'));

/* Priority 

// GET  
router.get('/priority', generateGET('priority', 'personId'));

// POST new priority
// params: personId, importance, name
router.post('/priority', generatePOST('priority'));

// DELETE priority with id
// params: priorityId
router.delete('/priority', generateDELETE('priority', 'priorityId'));

*/

/* Todo */

// GET all by user
// params: personId
router.get('/todo', generateGET('todo', 'personId'));

// POST new todo
// params: personId, info, categoryId, dateCreated, isDone, dateDone, isArchived, priorityVal
router.post('/todo', generatePOST('todo'));

// DELETE todo with id
// params: todoId
router.delete('/todo', generateDELETE('todo', 'todoId'));


function generateGET(table, matchParam) {
	return function (req, res) {
		console.log('GET received');

		// Generate query based on table
		let sql;
		if (table) {
			sql = `SELECT * FROM ${table} WHERE person_id = ${req.query[matchParam]}`;
		} else {
			sql = null;
		}

		let request = new Request(sql, function (err) {
			if (err) {
				console.log(err);
			}
		}
		);

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
		});

		connection.execSql(request);
	};
};

function generatePOST(table) {
	return function (req, res) {
		console.log('POST received');

		// Set query based on table
		let sql;
		switch (table) {
			case 'board':
				sql = `INSERT INTO board (person_id, title, date_created) 
                        VALUES (${ req.body.personId}, ${req.body.title}, ${req.body.dateCreated});`;
				break;
			case 'category':
				sql = `INSERT INTO category (person_id, title, color, default_order, priority_value, date_created, board_id) 
                        VALUES (${ req.body.personId}, ${req.body.title}, ${req.body.color}, ${req.body.defaultOrder},
                        ${ req.body.priorityValue}, ${req.body.dateCreated}, ${req.body.boardId});`;
				break;
			/*
			case 'priority':
				sql = `INSERT INTO priority (person_id, importance, name) 
                        VALUES (${ req.body.personId}, ${req.body.importance}, ${req.body.name});`;
				break;
			*/
			case 'todo':
				sql = `INSERT INTO todo (person_id, todo_info, category_id, date_created, is_done, date_done, is_archived, priority_value) 
                        VALUES (${ req.body.personId}, ${req.body.info}, ${req.body.categoryId}, ${req.body.dateCreated}, 
                        ${ req.body.isDone}, ${req.body.dateDone}, ${req.body.isArchived}, ${req.body.priorityVal});`;
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
			res.send('Holy macaroni. It worked!');
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
			res.send('Holy macaroni. It worked!');
		});

		connection.execSql(request);
	};
}

module.exports = router;