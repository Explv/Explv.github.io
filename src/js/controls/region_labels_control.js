'use strict';

import {Position} from '../model/Position.js';
import {CanvasLayer} from '../external/L.CanvasLayer.js';
import {Region,
        MIN_X, MAX_X,
        MIN_Y, MAX_Y,
        REGION_WIDTH, REGION_HEIGHT} from '../model/Region.js';

var RegionLabelsCanvas = CanvasLayer.extend({
    setData: function (data) {
        this.needRedraw();
    },

    onDrawLayer: function (info) {
        var zoom = this._map.getZoom();
        
        var fontSize = 0.15 * Math.pow(2, zoom);
                
        var ctx = info.canvas.getContext('2d');
        ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

        ctx.font = fontSize + 'px Calibri';
        ctx.fillStyle = 'white';
        ctx.textAlign = "center";

        for (var x = MIN_X; x < MAX_X; x += REGION_WIDTH) {
            for (var y = MIN_Y; y < MAX_Y; y += REGION_HEIGHT) {
                var position = new Position(x + (REGION_WIDTH / 2), y + (REGION_HEIGHT / 2), 0);
                var latLng = position.toCentreLatLng(this._map);

                var region = Region.fromPosition(position);

                var canvasPoint = info.layer._map.latLngToContainerPoint(latLng);

                ctx.fillText(region.id.toString(), canvasPoint.x, canvasPoint.y);
            }
        }
    }
});

export var RegionLabelsControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        map.createPane('region-labels');
        
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
        container.style.background = 'none';
        container.style.width = '130px';
        container.style.height = 'auto';

        var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        labelsButton.id = 'toggle-region-labels';
        labelsButton.innerHTML = 'Toggle Region Labels';

        var regionLabelsCanvas = new RegionLabelsCanvas({pane: "region-labels"});
        map.getPane("region-labels").style.display = "none";
        map.addLayer(regionLabelsCanvas);
        
        this.visible = false;

        L.DomEvent.on(labelsButton, 'click', () => {
            if (this.visible) {
                map.getPane("region-labels").style.display = "none";
            } else {
                map.getPane("region-labels").style.display = "";
            }
            this.visible = !this.visible;
        }, this);

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _toggleRegionLabels: function() {

    }
});