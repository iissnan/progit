(function () {
    function getFileNameFromUri(uri) {
        var pathName = uri.split("/");
        if (pathName.length > 0) {
            return pathName[pathName.length - 1];
        }
        return "";
    }

    var currentFileName = getFileNameFromUri(window.location.pathname);
    $(".sub-nav a").each(function() {
        if (getFileNameFromUri(this.href) === currentFileName) {
            $(this)
                .click(function(){
                    return false;
                })
                .parent().addClass("active");
        }
    });
}());
