'use strict';

import {CanvasLayer} from '../external/L.CanvasLayer.js';
import Locations from "../model/Locations.js";
import {Position} from "../model/Position.js";

var MapLabelsCanvas = CanvasLayer.extend({
    setData: function (data) {
        this.needRedraw();
    },

    onDrawLayer: function (info) {
        var zoom = this._map.getZoom();
        
        var fontSize = 0.12 * Math.pow(2, zoom);
        
        var ctx = info.canvas.getContext('2d');
        ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

        ctx.font = fontSize + 'px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = "center";
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        var self = this;
        Locations.getLocations(function(locations) {
            for (var i in locations) {
                //if (locations[location].z !== z) {
                //    continue;
                //}
                
                var position = locations[i].position;
                var latLng = position.toCentreLatLng(self._map);
                var canvasPoint = info.layer._map.latLngToContainerPoint(latLng);
                
                ctx.strokeText(locations[i].name, canvasPoint.x, canvasPoint.y);
                ctx.fillText(locations[i].name, canvasPoint.x, canvasPoint.y);
            }
        });
    }
});


export var MapLabelControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        map.createPane("map-labels");
        
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
        container.style.background = 'none';
        container.style.width = '100px';
        container.style.height = 'auto';

        var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        labelsButton.id = 'toggle-map-labels';
        labelsButton.innerHTML = 'Toggle Labels';

        L.DomEvent.on(labelsButton, 'click', this._toggleMapLabels, this);

        this._enabled = true;
        
        this._mapLabelsCanvas = new MapLabelsCanvas({pane: "map-labels"});
        this._map.addLayer(this._mapLabelsCanvas);
        
        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _toggleMapLabels: function() {
        if (this._enabled) {
            this._map.getPane("map-labels").style.display = "none";
            this._enabled = false;
        } else {
            this._map.getPane("map-labels").style.display = "";
            this._enabled = true;
        }
    }
});