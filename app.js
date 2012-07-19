var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    md = require('markdown');
const DIR_NAME_PGREPO = 'ProGitRepository';
const PATH_PGREPO = __dirname + '/' + DIR_NAME_PGREPO + '/';
const PATH_FIGURE = PATH_PGREPO + 'figures/';


// Start a Http Server, listen on port 8000
var app = express.createServer().listen(8000);



// 服务配置
app.configure(function(){
    app.set("view engine", "jade");
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + "/public"));
});
app.configure("development", function(){
    app.use(express.favicon(__dirname + "/public/favicon.ico"));
    app.use(express.errorHandler({dumpException:true, showStack: true}));

});
app.configure("production", function(){
    var oneYear = 31557600000;
    app.use(express.static(__dirname + "/public"));
    app.use(express.favicon(__dirname + "/public/favicon.ico"), {maxAge : oneYear});
    app.use(express.errorHandler());
    app.set("view engine", "jade");
});



// 路由配置
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
                res.send(404);
            }
        });
    }
});

app.get("/:controller?/:method?", function(req, res, next){
    console.log("Request url: " + req.url);

    var controller = req.params.controller,
        method = req.params.method;

    if (typeof controller === "undefined") {
        showContents("zh", res);
    } else if (controller === "about") {
        res.render("about");
    } else if (typeof controller !== "undefined"){
        if (typeof method === "undefined") {
            showContents(controller, res);
        } else {
            // get files
        }
    } else {
        next();
    }
});

function showContents(language, res){
    fs.exists(path.join(PATH_PGREPO, language), function(exists){
        if (exists) {
            res.render('index', {contents : [1,2]});
        } else {
            res.send(404);
        }
    });
}

function getFile(file){

}

/*
app.get('/:charpterId?', function(req, res){

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
*/

/* 404 */
app.get("*", function(req, res){
    res.send("Nothing Found", 404);
});

console.log('ProGit Server Running on the port 8000');
