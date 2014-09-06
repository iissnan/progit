(function () {
    var currentFileName = getFileNameFromUri(window.location.pathname);
    $(".sub-nav").find('a').each(function() {
        if (getFileNameFromUri(this.href) === currentFileName) {
            $(this)
                .click(function(){
                    return false;
                })
                .parent().addClass("active");
        }
    });

    function getFileNameFromUri(uri) {
        var pathName = uri.split("/");
        if (pathName.length > 0) {
            return pathName[pathName.length - 1];
        }
        return "";
    }

    $(document)
        .pjax('a', '#pjax-container', {fragment: '#pjax-container'})
        .on('pjax:start', function () {
            NProgress.start();
        })
        .on('pjax:end', function () {
            NProgress.done();
        });
}());
