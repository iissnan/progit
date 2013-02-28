var fs = require("fs"),
    md = require("markdown").markdown,
    jade = require("jade");

console.log("生成开始...");
console.log("=========================\n");

// 标题提取正则
var patternHeadline = /(#{1,6})(.*?)\1[\r\n|\n]+/g;

// 书籍源码路径
var bookSource = __dirname + "/../book_src",
    bookSourceZh = bookSource + "/zh";

var pathToHtml = __dirname + "/../html",
    pathToIndex = __dirname + "/../index.html";

// 模板
var pathToTemplateLayout = __dirname + "/../template/layout.jade",
    templateContent = fs.readFileSync(pathToTemplateLayout),
    template = jade.compile(templateContent);


// 遍历zh目录，生成TOC和章节页面
// zh目录结构：zh/:chapter-name/:chapter.md
function generateHTML(){
    var chapters = fs.readdirSync(bookSourceZh),
        chapter,
        chapterFiles,
        chapterFile,
        chapterContent,
        toc = "",
        i = 0;
    for (; i < chapters.length; i++) {

        // 章节目录名
        chapter = chapters[i];

        // 获取章节目录下的全部文件
        chapterFiles = fs.readdirSync(bookSourceZh + "/" + chapter);
        if (chapterFiles.length > 0) {
            chapterFile = chapterFiles[0];

            // 读取文件内容
            chapterContent = fs.readFileSync(bookSourceZh + "/" + chapter + "/" + chapterFile, "utf-8");
            if (chapterContent) {
                toc = toc + generateChapterTOC(chapterContent, i);
                generateChapterPages(chapterContent, i);

            }
        } else {
            console.log("没有此章节文件");
        }
    }

    // 输出TOC
    toc = '<ul class="toc">' + toc + '</ul>';
    fs.writeFileSync(pathToIndex, template({ title: "test", content: toc, isIndex: true}));

    console.log("\n=========================");
    console.log("生成完成");
}

// 生成章节目录
function generateChapterTOC(chapterContent, index) {
    var headline,
        result,
        level,
        i = 0,
        section,
        chapterToc = "";

    console.log("    读取章节" + index + "的目录");


    index = index + 1;
    while((result = patternHeadline.exec(chapterContent)) !== null) {

        // 根据#的个数判断headline的级别
        level = result[1].length;

        // 标题内容
        headline = result[2];

        // 仅输出h1和h2
        if (level < 3) {
            if (level === 1) {
                section = index;
            } else if (level === 2) {
                section = index + "." + i;
            }
            chapterToc = chapterToc +
                '<li class="headline' + level + '">' +
                '<a href="html/ch' + index + "_" + i + '.html">' +
                section + "  " + headline +
                '</a>' +
                '</li>';
            i++;
        }
    }
    return chapterToc;
}

// 生成html页面
function generateChapterPages(chapterContent, index) {
    var chapterHtml = md.toHTML(chapterContent);
    var pagePrefix = "ch" + (index + 1) + "_";
    var pathToPage = "";
    var pageContent = "";

    console.log("    读取章节" + index + "的内容...");
    console.log("    --------------------\n");

    var sections = chapterHtml.split("<h2");
    for (var j = 0; j < sections.length; j++) {
        pathToPage = pathToHtml + "/" + pagePrefix + j + ".html";
        if (j !== 0) {
            pageContent = "<h2" + sections[j];
        } else {
            pageContent = sections[j];
        }
        pageContent = template({ title: "test", content: pageContent, isIndex: false});

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
        fs.writeFileSync(pathToPage, pageContent);
    }
}

generateHTML();
