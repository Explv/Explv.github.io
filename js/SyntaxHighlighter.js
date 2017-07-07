'use strict';

define('SyntaxHighlighter', function() {
    return {
        highlight: function
            (div) {
            var text = div.text();
            text = text.replace(/ArrayList/g, "<span class='class-name'>ArrayList</span>");
            text = text.replace(/List/g, "<span class='class-name'>List</span>");
            text = text.replace(/Position/g, "<span class='class-name'>Position</span>");
            text = text.replace(/Area/g, "<span class='class-name'>Area</span>");
            text = text.replace(/Arrays/g, "<span class='class-name'>Arrays</span>");
            text = text.replace(/new/g, "<span class='keyword'>new</span>");
            div.html(text);
        }
    }
});