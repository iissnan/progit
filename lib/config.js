// source directory structure: zh/:chapter/:chapter.md

exports.CONFIG = {
    TEMPLATE_DIR: __dirname + "/../template",
    SOURCE_DIR: __dirname + "/../book_src",
    DESTINATION_DIR: __dirname + "/../html",

    defaultTranslation: "zh",
    supportTranslations: ["en", "zh"]
};