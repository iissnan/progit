var express = require('express');
var path = require('path');
var fs = require('fs');
var md = require('markdown');

// the directory name of pro git repository
var DIR_NAME_PGREPO = 'ProGitRepository';
var PATH_PGREPO = __dirname + '/' + DIR_NAME_PGREPO + '/';
var PATH_FIGURE = PATH_PGREPO + 'figures/';

var app = express.createServer().listen(8000);

app.get('/:charpterId?', function(req, res){
    var dir_zh = PATH_PGREPO + 'zh/';
    if (!req.params.charpterId) {
        fs.readdir(dir_zh, function(err, files){
            if (!err) {
                res.render('index.jade', {Contents : files, layout : false});
            } else {
                res.send(500);
            }
        });
    } else {
        var id = req.params.charpterId;
        console.log(id);

        fs.readdir(dir_zh, function(err, files){
            if (!err){
                for (var i = 0; i< files.length; i++) {
                    if (files[i].split('-')[0] == id) {
                        var filePath = path.join(dir_zh, files[i]);
                        console.log(filePath);
                        fs.readdir(filePath, function(err, files){
                            if (!err) {
                                if ( files.length > 0) {
                                    var file = path.join(filePath, files[0]);
                                    fs.readFile(file, 'utf-8', function(err, data){
                                        if (!err) {
                                            var resolve_figures = function (text) {
                                                return text.replace(/Insert ([^\.]+).png/g, function(all, figure) {
                                                    return '<img src="../../figures/' + figure + '-tn.png"><br>';
                                                });
                                            };

                                            res.send(resolve_figures(md.markdown.toHTML(data)));
                                        } else {
                                            res.send(500);
                                        }
                                    });
                                }
                            } else {
                                res.send(500);
                            }
                        });
                        break
                    }
                }
            } else {
                res.send(404);
            }
        });
    }
});

app.get('/figures/:figure_name', function(req, res){
    var figureName = req.params.figure_name;
    console.log(figureName);
    if (figureName) {
        var filePath = path.join(PATH_FIGURE, figureName);
        console.log(filePath);
        fs.readFile(filePath, function(err, data){
            if (!err) {
                res.contentType(filePath);
                res.send(data);
            } else {
                res.send('');
            }
        });
    }
});

console.log('ProGit Server Running on the port 8000');