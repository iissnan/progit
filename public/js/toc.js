(function() {
    var h2 = $("h2");
    h2.each(function(headline){
        $(".toc ul").append($('<li>' + this.innerHTML + '</li>'));
   });
}());
