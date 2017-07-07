require.config({
    shim : {
        "bootstrap" : { "deps" :['jquery'] }
    },
    paths: {
        jquery: "external/jquery-2.1.4",
        jqueryui: "https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min",
        leaflet: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.3/leaflet",
        bootstrap: "external/bootstrap.min",
        domReady: "external/domReady"
    }
});

requirejs(['main']);
