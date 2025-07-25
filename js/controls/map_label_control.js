'use strict';

import { CanvasLayer } from '../external/L.CanvasLayer.js';
import Locations from "../model/Locations.js";
import { Position } from "../model/Position.js";

var MapLabelsCanvas = CanvasLayer.extend({
    setData: function (data) {
        this.needRedraw();
    },

    onDrawLayer: function (info) {
        var zoom = this._map.getZoom();

        var ctx = info.canvas.getContext('2d');
        ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

        ctx.textAlign = "center";
        var self = this;
        Locations.getLocations(function (locations) {
            for (var i in locations) {
                if (locations[i].position.z !== info.layer._map.plane) {
                    continue;
                }

                // Map textScale values to font sizes
                let fontSize;
                if (typeof locations[i].size === 'number') {
                    switch (locations[i].size) {
                        case 0:
                            fontSize = 0.08; // default
                            break;
                        case 1:
                            fontSize = 0.10; // medium
                            break;
                        case 2:
                            fontSize = 0.18; // large
                            break;
                        default:
                            fontSize = 0.08;
                    }
                } else {
                    fontSize = 0.08; // fallback
                }
                
                // Convert textColor from decimal to hex, with fallback
                let fontColour = 'white';
                if (locations[i].color) {
                    fontColour = '#' + locations[i].color.toString(16).padStart(6, '0');
                }

                // Scale font size to match zoom
                const fontSizeScaled = fontSize * Math.pow(2, zoom);

                ctx.font = `bold ${fontSizeScaled}px Verdana`
                ctx.fillStyle = fontColour

                var position = locations[i].position;
                var latLng = position.toCentreLatLng(self._map);
                var canvasPoint = info.layer._map.latLngToContainerPoint(latLng);

                const name = locations[i].name

                // First split by <br> tags to handle explicit line breaks
                const brLines = name.split('<br>')
                const lines = []

                brLines.forEach(brLine => {
                    const words = brLine.trim().split(' ')
                    
                    let line = "";
                    words.forEach(word => {
                        if ((line + word).length < 10) {
                            if (line !== "") {
                                line += " "
                            }
                            line += word
                        } else {
                            if (line !== "") {
                                lines.push(line);
                            }
                            line = word;
                        }
                    })
                    if (line !== "") {
                        lines.push(line);
                    }
                })

                let y = canvasPoint.y;
                lines.forEach(line => {
                    ctx.strokeText(line, canvasPoint.x, y);
                    ctx.fillText(line, canvasPoint.x, y);
                    y += (fontSize + 0.02) * Math.pow(2, zoom);
                })
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

        L.DomEvent.disableClickPropagation(container);

        this._mapLabelsCanvas = new MapLabelsCanvas({ pane: "map-labels" });
        this._map.addLayer(this._mapLabelsCanvas);

        map.on('planeChanged', function () {
            this._mapLabelsCanvas.drawLayer();
        }, this);

        return container;
    },

    _toggleMapLabels: function () {
        if (this._enabled) {
            this._map.getPane("map-labels").style.display = "none";
            this._enabled = false;
        } else {
            this._map.getPane("map-labels").style.display = "";
            this._enabled = true;
        }
    }
});