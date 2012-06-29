var http = require('http');

var server = http.createServer().listen(8000);

server.on('request', function(req, res){
    res.writeHead(200);
    res.write('ProGit');
    res.end();
});

console.log('ProGit Server Running on the port 8000');