'use strict';

import Locations from "../model/Locations.js";
import {Position} from "../model/Position.js";

export var MapLabelControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '100px';
        container.style.height = 'auto';

        var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        labelsButton.id = 'toggle-map-labels';
        labelsButton.innerHTML = 'Toggle Labels';

        L.DomEvent.on(labelsButton, 'click', this._toggleMapLabels, this);

        this._enabled = true;
        this._addMapLabels();

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _toggleMapLabels: function() {
        if (this._enabled) {
            this._removeMapLabels();
            this._enabled = false;
        } else {
            this._addMapLabels();
            this._enabled = true;
        }
    },

    _addMapLabels: function() {
        if (!this.hasOwnProperty("_mapLabels") || this._mapLabels === undefined) {
            var self = this;
            
            Locations.getLocations(function(locations) {
                self._mapLabels = new L.layerGroup();

                for (var i in locations) {
                    //if (locations[location].z !== z) {
                    //    continue;
                    //}

                    var mapLabel = L.marker(locations[i].position.toCentreLatLng(self._map), {
                        icon: L.divIcon({
                            className: 'map-label',
                            html: `<p>${locations[i].name}</p>`
                        }),
                        zIndexOffset: 1000
                    });

                    self._mapLabels.addLayer(mapLabel);
                }
                
                self._map.addLayer(self._mapLabels);
            });

        } else {
            this._map.addLayer(this._mapLabels);
        }
    },

    _removeMapLabels: function() {
        this._map.removeLayer(this._mapLabels);
    }
});