var express = require('express');
var router = express.Router();

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES; 

// Create connection to database
var config = {
            userName: 'MikaY', 
            password: 'ILoveCodingPorcupine2017', 
            server: 'testing-mika.database.windows.net', 
            options: {
                database: 'porcupine-db',
                encrypt: true,
            }
        }
var connection = new Connection(config);
connection.on('connect', function(err) {  
    if (err) {
        console.log(err);
    } else {
        // If no error, then good to proceed.  
        console.log("Connected"); 
    } 
});   

// ROUTES

// home page
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Welcome' });
});

/* Todo */
// GET all
router.get('/todo/:userId', generateQuery('todo', 'userId'));

// POST 
router.post('/todo/:userId/:info/:categoryId/:dateCreated/:isDone/:dateDone/:isArchived/:priority', function(req, res, next) {
    var request = new Request(
        `INSERT INTO todo (person_id, todo_info, category_id, date_created, is_done, date_done, is_archived, priority_value) 
        OUTPUT INSERTED.todo_id 
        VALUES (${ req.params['userId'] }, ${ req.params['info'] }, ${ req.params['categoryId'] }, ${ req.params['dateCreated'] }, 
            ${ req.params['isDone'] }, ${ req.params['dateDone'] }, ${ req.params['isArchved'] }, ${ req.params['priority'] });`,
        function(err, rowCount, rows) {
            console.log(rowCount + ' row(s) inserted');
        }
    );

    request.on('doneInProc', function(rowCount, more) {  
        console.log(rowCount + ' rows affected');  
        res.status(200).json({ "post": "success" });
    });

    connection.execSql(request);
});

/* Category */
// GET  
router.get('/category/:userId', generateQuery('category', 'userId'));

/* Priority */
// GET  
router.get('/priority/:userId', generateQuery('priority', 'userId'));

function generateQuery(table, matchId) {
    return function (req, res, next) {
        console.log('GET received');
        var request = new Request(generateGET(table, req.params[matchId]), 
            function(err) {  
                if (err) {  
                    console.log(err);}  
                }
            );

        // Build array of json objects to return
        var jsonArray = [];
        request.on('row', function(columns) {  
            var rowObject = {};
            columns.forEach(function(column) {  
                rowObject[column.metadata.colName] = column.value;
            });  
            jsonArray.push(rowObject)
        });  

        request.on('doneInProc', function(rowCount, more) {  
            console.log(rowCount + ' rows returned');  
            res.status(200).json(jsonArray);
        });

        connection.execSql(request);
    }
}

function generateGET(table, id) {
    if (table) {
        return `SELECT * FROM ${ table } WHERE person_id = ${ id }`;
    } else {
        return null;
    }
};

module.exports = router;