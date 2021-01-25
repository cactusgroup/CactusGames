function setStyle(css) {
    document.getElementById("style").setAttribute("href", css);  
}

function initialize() {
    var style1 = document.getElementById("btn-setNewStyle");
    var style2 = document.getElementById("btn-setOldStyle");

    style1.onclick = function() {
        setStyle("style_new.css");
    }
    style2.onclick = function() {
        setStyle("style.css");
    }
}

window.addEventListener('load', () => {
    initialize();
}, false);