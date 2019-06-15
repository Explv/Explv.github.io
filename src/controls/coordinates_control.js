
import * as $ from 'jquery';
import * as L from 'leaflet';

import Position from '../model/Position';

const CoordinatesControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    container.id = 'coordinates-container';
    container.style.height = 'auto';
    L.DomEvent.disableClickPropagation(container);

    const coordinatesForm = L.DomUtil.create(
      'form',
      'leaflet-bar leaflet-control leaflet-control-custom form-inline',
      container,
    );

    const formGroup = L.DomUtil.create('div', 'form-group', coordinatesForm);

    this._xCoordInput = this._createInput('xCoord', 'x', formGroup);
    this._yCoordInput = this._createInput('yCoord', 'y', formGroup);
    this._zCoordInput = this._createInput('zCoord', 'z', formGroup);

    L.DomEvent.on(this._map, 'mousemove', this._setMousePositionCoordinates, this);

    return container;
  },

  _createInput(id, title, container) {
    const coordInput = L.DomUtil.create('input', 'form-control coord', container);
    coordInput.type = 'text';
    coordInput.id = id;

    L.DomEvent.disableClickPropagation(coordInput);
    L.DomEvent.on(coordInput, 'keyup', this._goToCoordinates, this);

    return coordInput;
  },

  _goToCoordinates() {
    const x = this._xCoordInput.value;
    const y = this._yCoordInput.value;
    const z = this._zCoordInput.value;

    if (!$.isNumeric(x) || !$.isNumeric(y) || !$.isNumeric(z)) {
      return;
    }

    if (this._searchMarker !== undefined) {
      this._map.removeLayer(this._searchMarker);
    }

    this._searchMarker = new L.marker(new Position(x, y, z).toCentreLatLng(this._map));

    this._searchMarker.once('click', () => this._map.removeLayer(this._searchMarker), this);

    this._searchMarker.addTo(this._map);

    this._map.panTo(this._searchMarker.getLatLng());

    if (this._map.plane !== z) {
      this._map.plane = z;
      this._map.updateMapPath();
    }
  },

  _setMousePositionCoordinates(e) {
    if (this._map.getContainer() !== document.activeElement) {
      return;
    }

    const mousePos = Position.fromLatLng(this._map, e.latlng, this._map.plane);

    this._xCoordInput.value = mousePos.x;
    this._yCoordInput.value = mousePos.y;
    this._zCoordInput.value = mousePos.z;
  },
});

export default CoordinatesControl;
