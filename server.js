var express = require('express');
var path = require('path');
var fs = require('fs');
var md = require('markdown');

// the directory name of pro git repository
var DIR_NAME_PGREPO = 'ProGitRepository';
var PATH_PGREPO = __dirname + '/' + DIR_NAME_PGREPO + '/';
var PATH_FIGURE = PATH_PGREPO + 'figures/';
var PATH_VIEW = __dirname + '/' + 'views/';

var app = express.createServer().listen(8000);

// 配置信息
app.configure(function(){});

app.configure("development", function(){
    app.use(express.static(__dirname + "/public"));
    app.use(express.favicon(__dirname + "/public/favicon.ico"));
    app.use(express.errorHandler({dumpException:true, showStack: true}));
});

app.configure("production", function(){
    var oneYear = 31557600000;
    app.use(express.static(__dirname + "/public"));
    app.use(express.favicon(__dirname + "/public/favicon.ico"), {maxAge : oneYear});
    app.use(express.errorHandler());
});


// 路由
app.get(/^\/([a-zA-Z]{1,2})(\/([0-9][1-9])?)?$/, function(req, res){
    
});

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

                                            //res.send(resolve_figures(md.markdown.toHTML(data)));
                                            res.render('layout.jade', {
                                                layout:false,
                                                content : resolve_figures(md.markdown.toHTML(data)),
                                                menu : '<ul><li><a target="_blank" href="01">01-introduction</a></li><li><a target="_blank" href="02">02-git-basics</a></li><li><a target="_blank" href="03">03-git-branching</a></li><li><a target="_blank" href="04">04-git-server</a></li><li><a target="_blank" href="05">05-distributed-git</a></li><li><a target="_blank" href="06">06-git-tools</a></li><li><a target="_blank" href="07">07-customizing-git</a></li><li><a target="_blank" href="08">08-git-and-other-scms</a></li><li><a target="_blank" href="09">09-git-internals</a></li></ul>'
                                            });
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

console.log('ProGit Server Running on the port 8000');
