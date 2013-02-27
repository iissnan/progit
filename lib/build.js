var fs = require("fs"),
    md = require("markdown").markdown;

console.log("building...");

// 标题提取正则
var patternHeadline = /(#{1,6})(.*?)\1[\r\n|\n]+/g;

// 书籍源码路径
var bookSource = __dirname + "/../book_src",
    bookSourceEn = bookSource + "/en",
    bookSourceZh = bookSource + "/zh";

var pathToLayoutHeader = __dirname + "/../layout/header.html",
    pathToLayoutFooter = __dirname + "/../layout/footer.html",
    layoutHeader = fs.readFileSync(pathToLayoutHeader),
    layoutFooter = fs.readFileSync(pathToLayoutFooter);

var pathToHtml = __dirname + "/../html",
    pathToTOC = pathToHtml + "/toc.html";

/* ===============================================
 * 章节目录
 * =============================================== */
var chapterNames = fs.readdirSync(bookSourceZh);

// 获取各章节的headline
function getHeadline(headlinePattern) {
    var html = "",
        toc = '<ul class="toc">';
    for (i = 0; i < chapterNames.length; i++) {
        var chapter = chapterNames[i];
        var pathToChapterDir = bookSourceZh + "/" + chapter;
        var chapterContentFile = fs.readdirSync(pathToChapterDir);
        var chapterContent = "";
        if (chapterContentFile.length > 0) {
            var pathToChapterFile = pathToChapterDir + "/" + chapterContentFile[0];
            chapterContent = fs.readFileSync(pathToChapterFile);
            chapterContent = chapterContent.toString();
            generatePages(i, chapterContent);
            while((headline = headlinePattern.exec(chapterContent)) !== null) {
                toc = toc +
                    '<li class="headline' + headline[1].length + '"><a href="/html/' + headline[2] + '.html">' +
                    (new Array(headline[1].length)).join(" ") +
                    headline[2] + '</a></li>';
            }
        }
    }

    toc += "</ul>";
    html = layoutHeader + toc + layoutFooter;
    //fs.writeFileSync(pathToTOC, html);
}

/**
 * 生成html页面
 */
function generatePages(index, chapterContent) {
    var chapterHtml = md.toHTML(chapterContent);
    var pagePrefix = "ch" + (index + 1) + "_";

    var sections = chapterHtml.split("<h2");
    for (var j = 0; j < sections.length; j++) {
        /*
        var rx = />(.*?)<\/h2>/g;
        var rr;
        if (index === 0) {
            while (rr = rx.exec(sections[j])) {
                console.log(rr[1]);
            }
            console.log("---------------------");
        }
        */
        fs.writeFileSync(pathToHtml + "/" + pagePrefix + j + ".html", layoutHeader + "<h2" + sections[j] + layoutFooter)
    }

    /*
     var h2 = /<h2>(.+)<\/h2>([\s\S]+?)<h2>/g;
    var result,
        i = 0;
    while (result = h2.exec(chapterHtml)) {
        if (index === 0) {
            console.log(result[1]);
        }
        // fs.writeFileSync(pathToHtml + "/" + fileNamePrefix + i + ".html", layoutHeader + result[1] + layoutFooter);
        i++;
    }*/
}

getHeadline(patternHeadline);
