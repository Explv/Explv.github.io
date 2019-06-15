
import * as L from 'leaflet';

const PlaneControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
    container.style.background = 'none';
    container.style.width = '70px';
    container.style.height = 'auto';

    const incrementPlaneButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    incrementPlaneButton.id = 'increase-level';
    incrementPlaneButton.innerHTML = 'Z +';

    L.DomEvent.on(incrementPlaneButton, 'click', this._increasePlane, this);

    const decrementPlaneButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    decrementPlaneButton.id = 'decrease-level';
    decrementPlaneButton.innerHTML = 'Z -';

    L.DomEvent.on(decrementPlaneButton, 'click', this._decreasePlane, this);

    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  _increasePlane() {
    if (this._map.plane === 3) {
      return;
    }
    this._map.plane += 1;
    this._map.updateMapPath();
    this._dispatchPlaneChangedEvent();
  },

  _decreasePlane() {
    if (this._map.plane === 0) {
      return;
    }
    this._map.plane -= 1;
    this._map.updateMapPath();
    this._dispatchPlaneChangedEvent();
  },

  _dispatchPlaneChangedEvent() {
    this._map.fire('planeChanged', {
      plane: this._map.plane,
    });
  },
});

export default PlaneControl;
