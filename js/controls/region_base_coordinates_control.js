'use strict';

import {Position} from '../model/Position.js';
import {Region} from '../model/Region.js';

export var RegionBaseCoordinatesControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {

        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.id = 'coordinates-container';
        container.style.height = 'auto';
        L.DomEvent.disableClickPropagation(container);

        var regionCoordinatesForm = L.DomUtil.create('form', 'leaflet-bar leaflet-control leaflet-control-custom form-inline', container);

        var formGroup = L.DomUtil.create('div', 'form-group', regionCoordinatesForm);

        this._xCoordInput = this._createInput("regionXCoord", "x", formGroup);
        this._yCoordInput = this._createInput("regionYCoord", "y", formGroup);

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

        this._xCoordInput.value = regionPos.x;
        this._yCoordInput.value = regionPos.y;
    }
});