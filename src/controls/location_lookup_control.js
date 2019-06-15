
import * as L from 'leaflet';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';

import Locations from '../model/Locations';
import Position from '../model/Position';

const LocationLookupControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    container.style.background = 'none';
    container.style.width = '200px';
    container.style.height = 'auto';

    const locationInput = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    locationInput.id = 'location-lookup';
    locationInput.type = 'text';
    locationInput.placeholder = 'Go to location';

    const self = this;
    Locations.getLocations((locations) => {
      const locationsArray = $.map(locations, (value, key) => ({
        label: value.name,
        value: value.position,
      }));
      self.locations = locationsArray;
    });

    $(locationInput).autocomplete({
      minLength: 2,
      source(request, response) {
        response($.ui.autocomplete.filter(self.locations, request.term));
      },
      focus(event, ui) {
        $('#location-lookup').val(ui.item.label);
        return false;
      },
      select(event, ui) {
        $('#location-lookup').val(ui.item.label);
        self._goToCoordinates(ui.item.value.x, ui.item.value.y, ui.item.value.z);
        return false;
      },
    });

    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  _goToCoordinates(x, y, z) {
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

});

export default LocationLookupControl;
