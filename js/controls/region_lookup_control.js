'use strict';

import {Position} from '../model/Position.js';
import {Region, MIN_X, MAX_X, MIN_Y, MAX_Y} from '../model/Region.js';

export var RegionLookupControl = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '130px';
        container.style.height = 'auto';

        var regionIDInput = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        regionIDInput.id = 'region-lookup';
        regionIDInput.type = 'number';
        regionIDInput.placeholder = "Go to region";
       
        L.DomEvent.on(regionIDInput, 'change keyup', function() {
            var regionIDText = regionIDInput.value;
            
            if (regionIDText.length == 0) {
                return;
            }
            
            var regionID = parseInt(regionIDText);
            
            var position = new Region(regionID).toCentrePosition();
            
            if (position.x >= MIN_X && position.x <= MAX_X && position.y >= MIN_Y && position.y <= MAX_Y) {
                this._goToCoordinates(position);
            }
        }, this);
        

        L.DomEvent.disableClickPropagation(container);
        return container;
    },
    
    _goToCoordinates: function(position) {
        if (this._searchMarker !== undefined) {
            this._map.removeLayer(this._searchMarker);
        }

        this._searchMarker = new L.marker(position.toCentreLatLng(this._map));

        this._searchMarker.once('click', (e) => this._map.removeLayer(this._searchMarker));

        this._searchMarker.addTo(this._map);

        this._map.panTo(this._searchMarker.getLatLng());

        if (this._map.plane != position.z) {
            this._map.plane = position.z;
            this._map.updateMapPath();
        }
    }
});