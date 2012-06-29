var http = require('http');
var path = require('path');
var fs = require('fs');

// the directory name of pro git repository
var DIR_NAME_PGREPO = 'ProGitRepository';

var server = http.createServer().listen(8000);

server.on('request', function(req, res){
    var dir_zh = __dirname + '/' + DIR_NAME_PGREPO + '/zh/';
    fs.readdir(dir_zh, function(err, files){
        if (!err) {
            res.writeHead(200);
            for (var i = 0; i < files.length; i++) {
                var filePath = path.join(dir_zh, files[i]);
                if (fs.statSync(filePath).isDirectory() ) {
                    res.write(files[i] + '\n');
                }
            }
            res.end();
        } else {
            res.writeHead(500);
            res.end();
        }
    });
});

console.log('ProGit Server Running on the port 8000');