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

var chapters = fs.readdirSync(bookSourceZh);

// 遍历zh目录，生成TOC和章节页面
// zh目录结构：zh/:chapter-name/:chapter.md
function generateHTML(){
    var chapter,
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
    var chapterLinks = generateH1(chapters, true);
    toc = '<ul class="toc">' + toc + '</ul>';
    fs.writeFileSync(pathToIndex, template({
        title: "ProGit 中文版",
        content: toc,
        isIndex: true,
        chapterLinks: chapterLinks
    }));

    console.log("\n=========================");
    console.log("生成完成");
}


// 获取H1
function generateH1(chapters, isIndex) {
    var chapter,
        chapterFiles,
        chapterFile,
        chapterContent,
        chapterLinks = "";
    for( var i = 0; i < chapters.length; i++) {
        chapter = chapters[i];
        chapterFiles = fs.readdirSync(bookSourceZh + "/" + chapter);
        if (chapterFiles.length > 0) {
            chapterFile = chapterFiles[0];
            chapterContent = fs.readFileSync(bookSourceZh + "/" + chapter + "/" + chapterFile, "utf-8");
            if (chapterContent) {
                var result;
                var j = 0;
                while((result = patternHeadline.exec(chapterContent)) !== null) {
                    if (result[1].length === 1) {
                        var href = (isIndex ? 'html/' : '') + 'ch' + (i+1) + '_' + j + '.html';
                        chapterLinks = chapterLinks + '<li><a href="' + href + '">' + (i + 1) + result[2] + '</a></li>';
                    }
                }
            }
        }
    }

    return chapterLinks;
}

// 生成章节目录
function generateChapterTOC(chapterContent, index) {
    var headline,
        result,
        level,
        i = 0,
        section,
        chapterToc = "";
    index = index + 1;

    console.log("    读取章节" + index + "的目录...");

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
    var chapterHtml = md.toHTML(chapterContent),
        pathToPage = "",
        pageContent = "",
        data = {},
        subNavigation = "";

    index = index + 1;
    var pagePrefix = "ch" + index + "_";

    console.log("    读取章节" + index + "的内容...");
    console.log("    --------------------\n");

   // 获取title
    var h1 = (/<h1>(.*?)<\/h1>/.exec(chapterHtml))[1];
    var rx = /<h2>(.*?)<\/h2>/g;
    var rr;
    var k = 1;
    while (rr = rx.exec(chapterHtml)) {
        subNavigation = subNavigation + '<li><a href="ch' + index + '_' + k +'.html">' + rr[1] + '</a></li>';
        k++;
    }
    data.sidebar = '<ul class="nav nav-list sub-nav affix">' + '<li class="nav-header">' + h1 + '</li>' + subNavigation + '</ul>';

    // 小节分割
    var sections = chapterHtml.split("<h2");
    for (var j = 0; j < sections.length; j++) {
        pathToPage = pathToHtml + "/" + pagePrefix + j + ".html";

        rx = />(.*?)<\/h2>/;
        var title = rx.exec(sections[j]);
        if (title) {
            title = h1 + " - " + title[1];
        } else {
            title = h1;
        }
        data.title = "ProGit - " + title;
        if (j === 0) {
            pageContent = sections[j];
        } else {
            pageContent = "<h2" + sections[j];
            data.prev = "ch" + index + "_" + (j - 1) + ".html";
        }

        if (j + 1 < sections.length) {
            data.next = "ch" + index + "_" + (j + 1) + ".html";
        } else {
            delete data.next;
        }
        data.content = imageReplace(pageContent);
        data.chapterLinks = generateH1(chapters);

        // 输出
        pageContent = template(data);
        fs.writeFileSync(pathToPage, pageContent);
    }

    function imageReplace(text) {
        return text.replace(/Insert ([^\.]+).png/g, function (all, figure) {
            return '<img src="../book_src/figures/' + figure + '-tn.png"></br>';
        })
    }
}

generateHTML();
