var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    md = require('markdown');

var DIR_NAME_PGREPO = 'ProGitRepository';
var PATH_PGREPO = __dirname + '/' + DIR_NAME_PGREPO + '/';
var PATH_FIGURE = PATH_PGREPO + 'figures/';


// Start a Http Server, listen on port 8000
var app = express.createServer().listen(8000);



/* ==================================
 * 服务配置
 * ================================== */
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



/* ==================================
 * 路由配置
 * ================================== */

// 图片地址
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

/* 404 */
app.get("*", function(req, res){
    res.send("Nothing Found", 404);
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

console.log('ProGit Server Running on the port 8000');
