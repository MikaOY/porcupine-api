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

// ROUTES

// home page
router.get('/', function (req, res) {
	res.render('index', { title: 'Porcupine' });
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

// DELETE todo with id
// URL params: todoId
router.delete('/todo', generateDELETE('todo', 'todoId'));

function generatePOST(table) {
	return function (req, res) {
		console.log('POST received');

		// Set query based on table
		let sql;
		switch (table) {
			case 'board':
				sql = `INSERT INTO board (person_id_board, board_title, board_date_created) 
                        VALUES (${req.body.userId}, ${req.body.title}, ${req.body.dateCreated});`;
				break;
			case 'category':
				sql = `INSERT INTO category (person_id_category, category_title, color, default_order, category_priority, category_date_created, board_id_category) 
                        VALUES (${req.body.userId}, ${req.body.title}, ${req.body.color}, ${req.body.defaultOrder},
                        ${req.body.priorityVal}, ${req.body.dateCreated}, ${req.body.boardId});`;
				break;
			/*
			case 'priority':
				sql = `INSERT INTO priority (person_id, importance, name) 
                        VALUES (${req.body.userId}, ${req.body.importance}, ${req.body.name});`;
				break;
			*/
			case 'todo':
				sql = `INSERT INTO todo (person_id_todo, todo_info, category_id_todo, todo_date_created, is_done, date_done, is_archived, todo_priority, date_due) 
                        VALUES (${req.body.userId}, ${req.body.info}, ${req.body.categoryId}, ${req.body.dateCreated}, 
                        ${req.body.isDone}, ${req.body.dateDone}, ${req.body.isArchived}, ${req.body.priorityVal}, ${req.body.dateDue});`;
				break;
		}
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

function generateGET(table, matchParam) {
	return function (req, res) {
		console.log('GET received');

		// Generate query based on table
		let sql;
		if (table) {
			sql = `SELECT * FROM ${table} WHERE person_id_${table} = ${req.query[matchParam]}`;
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
				let defaultOrder = req.body.defaultOrder;
				let priorityValue = req.body.priorityVal;

				// Generate SQL query, adjusted for different number of defined URL params
				sql = `UPDATE ${table} 
							SET ${catTitle == undefined ? '' : ('category_title = ' + catTitle)}${catBoardId !== undefined ? ', ' : ''}
								${catBoardId == undefined ? '' : ('board_id_category = ' + catBoardId)}${color !== undefined ? ', ' : ''}
								${color == undefined ? '' : ('color = ' + color)}${catDateCreated !== undefined ? ', ' : ''}
								${catDateCreated == undefined ? '' : ('category_date_created = ' + catDateCreated)}${defaultOrder !== undefined ? ', ' : ''}
								${defaultOrder == undefined ? '' : ('default_order = ' + defaultOrder)}${priorityValue !== undefined ? ', ' : ''}
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
		}
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
	}
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