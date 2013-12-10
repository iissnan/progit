var CONFIG = require("./config.js");
var Converter = require("./converter.js");

for (var i = 0; i < CONFIG.supportTranslations.length; i++) {
    Converter.convert(CONFIG.supportTranslations[i]);
}
