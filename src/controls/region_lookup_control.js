
import * as L from 'leaflet';

import {
  Region, MIN_X, MAX_X, MIN_Y, MAX_Y,
} from '../model/Region';

const RegionLookupControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    container.style.background = 'none';
    container.style.width = '130px';
    container.style.height = 'auto';

    const regionIDInput = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    regionIDInput.id = 'region-lookup';
    regionIDInput.type = 'number';
    regionIDInput.placeholder = 'Go to region';

    L.DomEvent.on(regionIDInput, 'change keyup', () => {
      const regionIDText = regionIDInput.value;

      if (regionIDText.length === 0) {
        return;
      }

      const regionID = parseInt(regionIDText, 10);

      const position = new Region(regionID).toCentrePosition();

      if (position.x >= MIN_X && position.x <= MAX_X && position.y >= MIN_Y && position.y <= MAX_Y) {
        this._goToCoordinates(position);
      }
    }, this);


    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  _goToCoordinates(position) {
    if (this._searchMarker !== undefined) {
      this._map.removeLayer(this._searchMarker);
    }

    this._searchMarker = new L.marker(position.toCentreLatLng(this._map));

    this._searchMarker.once('click', this._map.removeLayer(this._searchMarker), this);

    this._searchMarker.addTo(this._map);

    this._map.panTo(this._searchMarker.getLatLng());

    if (this._map.plane !== position.z) {
      this._map.plane = position.z;
      this._map.updateMapPath();
    }
  },
});

export default RegionLookupControl;
