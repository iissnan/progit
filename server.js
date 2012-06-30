var express = require('express');
var path = require('path');
var fs = require('fs');

// the directory name of pro git repository
var DIR_NAME_PGREPO = 'ProGitRepository';

var server = express.createServer().listen(8000);
server.get('/', function(req, res){
    var dir_zh = __dirname + '/' + DIR_NAME_PGREPO + '/zh/';
        fs.readdir(dir_zh, function(err, files){
            if (!err) {
                res.render('index.jade', {Contents : files, layout : false});
            } else {
                res.writeHead(500);
                res.end();
            }
        });
});

console.log('ProGit Server Running on the port 8000');