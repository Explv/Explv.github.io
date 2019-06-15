
import * as L from 'leaflet';

import Position from '../model/Position';
import { Region } from '../model/Region';

const RegionBaseCoordinatesControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    container.id = 'coordinates-container';
    container.style.height = 'auto';
    L.DomEvent.disableClickPropagation(container);

    const regionCoordinatesForm = L.DomUtil.create(
      'form',
      'leaflet-bar leaflet-control leaflet-control-custom form-inline',
      container,
    );

    const formGroup = L.DomUtil.create('div', 'form-group', regionCoordinatesForm);

    this._xCoordInput = this._createInput('regionXCoord', 'x', formGroup);
    this._yCoordInput = this._createInput('regionYCoord', 'y', formGroup);

    L.DomEvent.on(this._map, 'mousemove', this._setMousePositionCoordinates, this);

    return container;
  },

  _createInput(id, title, container) {
    const coordInput = L.DomUtil.create('input', 'form-control coord', container);
    coordInput.type = 'text';
    coordInput.id = id;

    L.DomEvent.disableClickPropagation(coordInput);
    return coordInput;
  },

  _setMousePositionCoordinates(e) {
    if (this._map.getContainer() !== document.activeElement) {
      return;
    }

    const mousePos = Position.fromLatLng(this._map, e.latlng, this._map.plane);
    const regionPos = Region.fromPosition(mousePos).toPosition();

    this._xCoordInput.value = regionPos.x;
    this._yCoordInput.value = regionPos.y;
  },
});

export default RegionBaseCoordinatesControl;
