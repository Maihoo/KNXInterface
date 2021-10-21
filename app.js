const app     = require('express')();
const http    = require('http').Server(app);
const io      = require('socket.io')(http);
const mysql   = require('mysql');
var port      = process.env.PORT || 3000;
const ip      = '192.168.178.65';

// CREATE CONNECTION
const db = mysql.createConnection({
  host      : 'sindabusdb2.cjibhismj6nf.eu-central-1.rds.amazonaws.com',
  user      : 'knx_log_reader',
  //flags     : '-h',
  port      : '3306',
  password  : 'IL4JFWLu6l13f9YSQrZliSKvf',
  database  : 'knx_log'
});

// CONNECT
db.connect((err) => {
  if(err) {
    throw err;
  }
  console.log('mysql connected...');
});

app.get('/',              function(req, res){ res.sendFile(__dirname + '/index.html'    );});
app.get('/style.css',     function(req, res){ res.sendFile(__dirname + '/style.css'     );});
app.get('/js/jquery.js',  function(req, res){ res.sendFile(__dirname + '/js/jquery.js'  );});
app.get('/res/plan.png',  function(req, res){ res.sendFile(__dirname + '/res/plan.png'  );});
app.get('/test'     , (req, res) => {
var sql = 'SELECT * FROM knx_log.log_kzh WHERE source_addr = "3.6.4" limit 1';
  
db.query(sql, (err, result) => {
  if(err) throw err;
  console.log(result);
  res.send(result);
  });
});

io.on('connection', (socket) => {
  console.log('new client connected.');

  socket.on('dataLast', (ti, id) => {
    var sql = 'SELECT * FROM knx_log.log_kzh ' 
            + 'WHERE timestamp > "' + ti + '" '
            + 'AND source_addr = "' + id  + '" '
            + 'ORDER BY timestamp desc '
            + 'limit 200';
            
    sendSQLQuery(sql);
  });

  socket.on('dataRange', (ti, to, id) => {
    var sql = 'SELECT * FROM knx_log.log_kzh ' 
            + 'WHERE timestamp > "' + ti + '" '
            + 'AND timestamp < "' + to  + '" '
            + 'AND source_addr = "' + id  + '" '
            + 'ORDER BY timestamp desc '
            + 'limit 200';
            
    sendSQLQuery(sql);
  });

  socket.on('dataLastall', ti => {
    var sql = 'SELECT * FROM knx_log.log_kzh ' 
            + 'WHERE timestamp > "' + ti + '" '
            + 'ORDER BY timestamp desc '
            + 'limit 500';
            
    sendSQLQuery(sql);
  });
});

function sendSQLQuery(sql) {
  console.log('should send query');
  db.query(sql, (err, result) => {
    if(err) throw err;
    console.log(sql);

    //res.send(result);
    io.emit('data', result);
  });
}

http.listen(port, () => {
  console.log(`Socket.IO server running at http://${ip}:${port}/`);
});
