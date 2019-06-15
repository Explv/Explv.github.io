
import * as L from 'leaflet';

import Position from '../model/Position';

import {
  REGION_WIDTH, REGION_HEIGHT,
  MIN_X, MAX_X,
  MIN_Y, MAX_Y,
} from '../model/Region';

const GridControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
    container.style.background = 'none';
    container.style.width = '130px';
    container.style.height = 'auto';

    const labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    labelsButton.id = 'toggle-region-grid';
    labelsButton.innerHTML = 'Toggle Region Grid';

    this._gridFeatureGroup = this._createGridFeature();
    this._enabled = false;

    L.DomEvent.on(labelsButton, 'click', this._toggleGrid, this);

    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  _toggleGrid() {
    if (this._enabled) {
      this._map.removeLayer(this._gridFeatureGroup);
      this._enabled = false;
    } else {
      this._map.addLayer(this._gridFeatureGroup);
      this._enabled = true;
    }
  },

  _createGridFeature() {
    const gridFeatureGroup = new L.FeatureGroup();

    for (let x = MIN_X; x <= MAX_X; x += REGION_WIDTH) {
      const startPos = new Position(x, MIN_Y, 0);
      const endPos = new Position(x, MAX_Y, 0);

      const line = L.polyline([startPos.toLatLng(this._map), endPos.toLatLng(this._map)], { clickable: false });
      gridFeatureGroup.addLayer(line);
    }

    for (let y = MIN_Y; y <= MAX_Y; y += REGION_HEIGHT) {
      const startPos = new Position(MIN_X, y, 0);
      const endPos = new Position(MAX_X, y, 0);

      const line = L.polyline([startPos.toLatLng(this._map), endPos.toLatLng(this._map)], { clickable: false });
      gridFeatureGroup.addLayer(line);
    }

    return gridFeatureGroup;
  },
});

export default GridControl;
