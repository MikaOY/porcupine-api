var express = require('express');
var router = express.Router();

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
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
        console.log('BAD');
    } else {
        // If no error, then good to proceed.  
        console.log("Connected"); 
    } 
});   

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Welcome' });
});

router.route('/todos/:userId')
    .get(function (req, res, next) {
        console.log('GET received');
        var request = new Request(`SELECT * FROM todo WHERE person_id = ${ req.params['userId'] }`, 
            function(err) {  
                if (err) {  
                    console.log(err);}  
                });

        // Build array of json objects to return
        var jsonArray = [];
        request.on('row', function(columns) {  
            console.log('hit row!');
            console.log(jsonArray.length);
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
    });

module.exports = router;