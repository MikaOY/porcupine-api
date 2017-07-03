// @ts-nocheck

import { connection, router, Request } from './config';
import { generatePUT } from'./index';

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

module.exports = router;
