
import * as L from 'leaflet';

import CanvasLayer from '../plugins/L.CanvasLayer';
import Locations from '../model/Locations';

const MapLabelsCanvas = CanvasLayer.extend({
  setData() {
    this.needRedraw();
  },

  onDrawLayer(info) {
    const zoom = this._map.getZoom();

    const fontSize = 0.3 * (zoom ** 2);

    const ctx = info.canvas.getContext('2d');
    ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    const self = this;
    Locations.getLocations((locations) => {
      locations.forEach((location) => {
        if (location.position.z === info.layer._map.plane) {
          const latLng = location.position.toCentreLatLng(self._map);
          const canvasPoint = info.layer._map.latLngToContainerPoint(latLng);

          ctx.strokeText(location.name, canvasPoint.x, canvasPoint.y);
          ctx.fillText(location.name, canvasPoint.x, canvasPoint.y);
        }
      });
    });
  },
});


const MapLabelControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd(map) {
    map.createPane('map-labels');

    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
    container.style.background = 'none';
    container.style.width = '100px';
    container.style.height = 'auto';

    const labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    labelsButton.id = 'toggle-map-labels';
    labelsButton.innerHTML = 'Toggle Labels';

    L.DomEvent.on(labelsButton, 'click', this._toggleMapLabels, this);

    this._enabled = true;

    L.DomEvent.disableClickPropagation(container);

    this._mapLabelsCanvas = new MapLabelsCanvas({ pane: 'map-labels' });
    this._map.addLayer(this._mapLabelsCanvas);

    map.on('planeChanged', () => {
      this._mapLabelsCanvas.drawLayer();
    }, this);

    return container;
  },

  _toggleMapLabels() {
    if (this._enabled) {
      this._map.getPane('map-labels').style.display = 'none';
      this._enabled = false;
    } else {
      this._map.getPane('map-labels').style.display = '';
      this._enabled = true;
    }
  },
});

export default MapLabelControl;
