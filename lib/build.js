var fs = require("fs"),
    md = require("markdown").markdown,
    jade = require("jade");

console.log("生成开始...");
console.log("=========================\n");

// 标题提取正则
var patternHeadline = /(#{1,6})(.*?)\1[\r\n|\n]+/g;

// 书籍源码路径
var bookSource = __dirname + "/../book_src",
    bookSourceEn = bookSource + "/en",
    bookSourceZh = bookSource + "/zh";

var pathOutput = __dirname + "/../html",
    pathOutputZh = pathOutput + "/zh",
    pathIndexZh = __dirname + "/../index.html",
    pathOutputEn = pathOutput + "/en",
    pathIndexEn = __dirname + "/../index.en.html";

// 模板
var pathTemplate = __dirname + "/../template",
    pathTemplateLayout = pathTemplate + "/layout.jade",
    pathTemplateIndex = pathTemplate + "/index.jade",
    pathTemplatePages = pathTemplate + "/pages.jade",
    templateIndex = jade.compile(
        fs.readFileSync(pathTemplateIndex, "utf-8"),
        {filename: pathTemplateLayout}
    ),
    templatePages = jade.compile(
        fs.readFileSync(pathTemplatePages, "utf-8"),
        {filename: pathTemplateLayout}
    );

var translateInfoOfZh = {
    name: "zh",
    source: bookSourceZh,
    indexPage: pathIndexZh,
    output: pathOutputZh,
    title: "Pro Git 简体中文版"
};

var translateInfoOfEn = {
    name: "en",
    source: bookSourceEn,
    indexPage: pathIndexEn,
    output: pathOutputEn,
    title: "Pro Git"
};

function generateZh() {
    console.log("  简体中文版");
    console.log("  --------\n");
    var chapters = fs.readdirSync(bookSourceZh);
    generate(chapters, translateInfoOfZh);
}
function generateEn() {
    console.log("  英文版");
    console.log("  --------\n");
    var chapters = fs.readdirSync(bookSourceEn);
    generate(chapters, translateInfoOfEn);
}

var chapterLinksZh = [];
var chapterLinksEn = [];

function generateNav() {
    var chapters = fs.readdirSync(bookSourceZh);
    chapterLinksZh = generateH1(chapters, translateInfoOfZh);

    chapters = fs.readdirSync(bookSourceEn);
    chapterLinksEn = generateH1(chapters, translateInfoOfEn);
}

// 遍历目录，生成TOC和章节页面
// 目录结构：:translate/:chapter-name/:chapter.md
function generate(chapters, translate){
    var chapter,
        chapterFiles,
        chapterFile,
        chapterContent,
        toc = "",
        sourceDirectory = translate.source;

    generateNav();

    for (var i = 0; i < chapters.length; i++) {

        // 章节目录名
        chapter = chapters[i];

        // 获取章节目录下的全部文件
        chapterFiles = fs.readdirSync(sourceDirectory + "/" + chapter);
        if (chapterFiles.length > 0) {
            chapterFile = chapterFiles[0];

            // 读取文件内容
            chapterContent = fs.readFileSync(sourceDirectory + "/" + chapter + "/" + chapterFile, "utf-8");
            if (chapterContent) {
                toc = toc + generateChapterTOC(chapterContent, i, translate);
                generateChapterPages(chapterContent, i, chapters, translate);
            }
        } else {
            console.log("没有此章节文件");
        }
    }

    // 首页
    // 输出包含h1和h2的目录
    toc = '<ul class="toc">' + toc + '</ul>';
    fs.writeFileSync(translate.indexPage, templateIndex({
        title: translate.title,
        content: toc,
        chapterLinksZh: chapterLinksZh.map(function(li){ return li.replace('href="', 'href="html/zh/')}).join(""),
        chapterLinksEn: chapterLinksEn.map(function(li){ return li.replace('href="', 'href="html/en/')}).join("")
    }));


}


// 获取章节名称（H1）
function generateH1(chapters, translate) {
    var chapter,
        chapterFiles,
        chapterFile,
        chapterContent,
        chapterLinks = [];
    var link = 'li: a(href="#{href}") #{text}',
        templateLink = jade.compile(link);

    for( var i = 0; i < chapters.length; i++) {
        chapter = chapters[i];
        chapterFiles = fs.readdirSync(translate.source + "/" + chapter);

        if (chapterFiles.length > 0) {
            chapterFile = chapterFiles[0];
            chapterContent = fs.readFileSync(translate.source + "/" + chapter + "/" + chapterFile, "utf-8");
            if (chapterContent) {
                var result;
                var j = 0;
                var chapterIndex = i + 1;

                while((result = patternHeadline.exec(chapterContent)) !== null) {
                    if (result[1].length === 1) {
                        chapterLinks.push(templateLink({
                            href: 'ch' + chapterIndex + '_' + j + '.html',
                            text: chapterIndex + result[2]
                        }));
                    }
                }
            }
        }
    }

    return chapterLinks;
}

// 生成章节目录
function generateChapterTOC(chapterContent, index, translate) {
    var headline,
        result,
        level,
        i = 0,
        section,
        chapterToc = "";
    var link = 'li(class="headline#{level}"): a(href="#{href}") #{text}',
        templateLink = jade.compile(link);

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
            chapterToc = chapterToc + templateLink({
                level: level,
                href: 'html/' + translate.name + '/ch' + index + "_" + i + '.html',
                text: section + "  " + headline
            });
            i++;
        }
    }
    return chapterToc;
}

// 生成html页面
function generateChapterPages(chapterContent, index, chapters, translate) {
    var chapterHtml = md.toHTML(chapterContent),
        pathToPage = "",
        pageContent = "",
        data = {},
        subNavigation = "";
    var link = 'li: a(href="#{href}") #{text}',
        templateLink = jade.compile(link);

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
        subNavigation = subNavigation + templateLink({
            href: 'ch' + index + '_' + k +'.html',
            text: rr[1]
        });
        k++;
    }
    data.sidebar = '<ul class="nav nav-tabs nav-stacked sub-nav affix">' +
        '<li class="nav-header">' + h1 + '</li>' +
        subNavigation +
        '</ul>';

    // 小节分割
    var sections = chapterHtml.split("<h2");
    for (var j = 0; j < sections.length; j++) {
        pathToPage = translate.output + "/" + pagePrefix + j + ".html";

        rx = />(.*?)<\/h2>/;
        var title = rx.exec(sections[j]);
        if (title) {
            title = h1 + " - " + title[1];
        } else {
            title = h1;
        }
        data.title = "Pro Git - " + title;
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
        data.chapterLinksEn = function () {
            if (translate.name === "en") {
                return chapterLinksEn.join("");
            } else {
                return chapterLinksEn.map(function(li){return li.replace('href="', 'href="../en/');}).join("");
            }
        }();
        data.chapterLinksZh = function () {
            if (translate.name === "zh") {
                return chapterLinksZh.join("");
            } else {
                return chapterLinksZh.map(function(li){return li.replace('href="', 'href="../zh/');}).join("");
            }
        }();

        // 输出
        pageContent = templatePages(data);
        fs.writeFileSync(pathToPage, pageContent);
    }

    function imageReplace(text) {
        return text.replace(/Insert ([^\.]+).png/g, function (all, figure) {
            return '<img src="../../book_src/figures/' + figure + '-tn.png"></br>';
        });
    }
}

generateZh();
generateEn();

console.log("生成完成");
console.log("\n=========================");