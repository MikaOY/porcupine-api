// @ts-nocheck

var express = require('express');
var router = express.Router();
let Request = require('tedious').Request;
let _config = require('./config');

// CORS
router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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

	_config.connection.execSql(request);
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
router.put('/board', _config.generatePUT('board'));

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
router.put('/category', _config.generatePUT('category'));

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
router.put('/todo', _config.generatePUT('todo'));

// PUT (delete) todo
// body MUST: todoId, userId
router.put('/todo/delete', generatePUTDelete('todo', '1'));
// restore
router.put('/todo/restore', generatePUTDelete('todo', '0'));

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

		_config.connection.execSql(request);
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

		_config.connection.execSql(request);
	};
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

		_config.connection.execSql(request);
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

		_config.connection.execSql(request);
	};
}

module.exports = router;
