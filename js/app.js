require.config({
	paths: {
        jquery: "external/jquery-2.1.4",
        jqueryui: "https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min",
        leaflet: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/leaflet",
		canvas_layer: "js/L.CanvasLayer",
        bootstrap: "external/bootstrap.min",
        domReady: "external/domReady"
    },
    shim : {
        "bootstrap" : { "deps" :['jquery'] },
		"leaflet" : { exports : "L" },
		"canvas_layer": { "deps" :['leaflet'] }
    }
});

requirejs(['main']);