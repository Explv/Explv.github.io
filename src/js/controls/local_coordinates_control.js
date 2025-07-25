'use strict';

import {Position} from '../model/Position.js';
import {Region} from '../model/Region.js';

export var LocalCoordinatesControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {

        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.id = 'coordinates-container';
        container.style.height = 'auto';
        L.DomEvent.disableClickPropagation(container);

        var localCoordinatesForm = L.DomUtil.create('form', 'leaflet-bar leaflet-control leaflet-control-custom form-inline', container);

        var formGroup = L.DomUtil.create('div', 'form-group', localCoordinatesForm);

        this._xCoordInput = this._createInput("localXCoord", "x", formGroup);
        this._yCoordInput = this._createInput("localYCoord", "y", formGroup);

        L.DomEvent.on(this._map, 'mousemove', this._setMousePositionCoordinates, this);

        return container;
    },

    _createInput: function(id, title, container, keyupFunc) {
        var coordInput = L.DomUtil.create('input', 'form-control coord', container);
        coordInput.type = 'text';
        coordInput.id = id;

        L.DomEvent.disableClickPropagation(coordInput);
        return coordInput;
    },

    _setMousePositionCoordinates: function(e) {
		if (this._map.getContainer() !== document.activeElement) {
			return;
		}
		
        var mousePos = Position.fromLatLng(this._map, e.latlng, this._map.plane);
        var regionPos = Region.fromPosition(mousePos).toPosition();
        
        var localX = mousePos.x - regionPos.x;
        var localY = mousePos.y - regionPos.y;

        this._xCoordInput.value = localX;
        this._yCoordInput.value = localY;
    }
});