var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    md = require('markdown');

var DIR_NAME_PGREPO = 'ProGitRepository';
var PATH_PGREPO = __dirname + '/' + DIR_NAME_PGREPO + '/';
var PATH_FIGURE = PATH_PGREPO + 'figures/';

var app = express();


/* ==================================
 * 服务配置
 * ================================== */
var oneYear = 31557600000;
app.set("view engine", "jade");
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + "/public"));
app.use(express.favicon(__dirname + "/public/favicon.ico"), {maxAge : oneYear});

app.configure("development", function(){
    app.use(express.errorHandler({dumpException:true, showStack: true}));

});
app.configure("production", function(){
    app.use(express.errorHandler());
});



/* ==================================
 * 路由配置
 * ================================== */

// 图片地址
app.get('/figures/:figure_name', function(req, res){
    var figureName = req.params.figure_name;
    if (figureName) {
        var filePath = path.join(PATH_FIGURE, figureName);
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



app.get("/", function (req, res) {
    // 默认现实中文章节列表
    showChapterList("zh", res);
});

app.get("/about", function (req, res) {
   res.render("about");
});

app.get("/:translate", function (req, res, next) {
    var translate = req.params.translate;
    var availableTranslate = ["en", "zh", "zh-tw"];
    if (availableTranslate.indexOf(translate) === -1) {
        res.send(404);
    } else {
        showChapterList(translate, res);
    }
});

app.get("/:translate/:chapter", function (req, res, next) {

});

/* Not Routes matched, show 404 */
app.get("*", function(req, res){
    res.send("Nothing Found", 404);
});


/* ==================================
 * 逻辑处理
 * ================================== */

 /**
 * 显示章节列表
 * @param translate
 * @param res
 */
function showChapterList(translate, res){
    fs.exists(path.join(PATH_PGREPO, translate), function(exists){
        if (exists) {
            res.render('index', {chapters : getChapterList(translate)});
        } else {
            res.send(404);
        }
    });
}

/**
 * 获取translate下的章节
 * @param translate
 * @return {*}
 */
function getChapterList(translate){
    var translateDirectory = path.join(PATH_PGREPO, translate);
    var chapterMapping = {
        "01-introduction": {
            "en" : "Introduction",
            "zh" : "起步"
        },
        "02-git-basics" : {
            "en" : "Git Basics",
            "zh" : "Git 基础"
        },
        "03-git-branching" : {
            "en" : "Git Branching",
            "zh" : "Git 分支"
        },
        "04-git-server" : {
            "en" : "Git on the Server",
            "zh" : "服务器上的 Git"
        },
        "05-distributed-git": {
            "en" : "Distributed Git",
            "zh" : "分布式 Git"
        },
        "06-git-tools" : {
            "en" : "Git Tools",
            "zh" : "Git 工具"
        },
        "07-customizing-git": {
            "en" : "Customizing Git",
            "zh" : "自定义 Git"
        },
        "08-git-and-other-scms" : {
            "en" : "Git and Other Systems",
            "zh" : "Git 与其他系统"
        },
        "09-git-internals": {
            "en" : "Git Internals",
            "zh" : "Git 内部原理"
        }
    };
    var chapters = fs.readdirSync(translateDirectory);
    chapters = chapters.map(function(chapter, i) {
        return i + " " + chapterMapping[chapter][translate];
    });

    return chapters;
}

/**
 * 获取章节内容
 * @param file
 */
function getChapterContent(file){

}

app.listen(8000);
console.log('ProGit Server Running on the port 8000');
