var CONFIG = require("./config.js").CONFIG;
var Converter = require("./converter.js").Converter;

for (var i = 0; i < CONFIG.supportTranslations.length; i++) {
    Converter.convert(CONFIG.supportTranslations[i]);
}
