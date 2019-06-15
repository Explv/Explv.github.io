
import * as L from 'leaflet';

import Position from '../model/Position';
import CanvasLayer from '../plugins/L.CanvasLayer';
import {
  Region,
  MIN_X, MAX_X,
  MIN_Y, MAX_Y,
  REGION_WIDTH, REGION_HEIGHT,
} from '../model/Region';

const RegionLabelsCanvas = CanvasLayer.extend({
  setData() {
    this.needRedraw();
  },

  onDrawLayer(info) {
    const zoom = this._map.getZoom();

    const fontSize = 0.15 * (zoom ** 2);

    const ctx = info.canvas.getContext('2d');
    ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

    ctx.font = `${fontSize}px Calibri`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    for (let x = MIN_X; x < MAX_X; x += REGION_WIDTH) {
      for (let y = MIN_Y; y < MAX_Y; y += REGION_HEIGHT) {
        const position = new Position(x + (REGION_WIDTH / 2), y + (REGION_HEIGHT / 2), 0);
        const latLng = position.toCentreLatLng(this._map);

        const region = Region.fromPosition(position);

        const canvasPoint = info.layer._map.latLngToContainerPoint(latLng);

        ctx.fillText(region.id.toString(), canvasPoint.x, canvasPoint.y);
      }
    }
  },
});

const RegionLabelsControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd(map) {
    map.createPane('region-labels');

    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
    container.style.background = 'none';
    container.style.width = '130px';
    container.style.height = 'auto';

    const labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    labelsButton.id = 'toggle-region-labels';
    labelsButton.innerHTML = 'Toggle Region Labels';

    const regionLabelsCanvas = new RegionLabelsCanvas({ pane: 'region-labels' });
    const regionLabels = map.getPane('region-labels');
    regionLabels.style.display = 'none';
    map.addLayer(regionLabelsCanvas);

    this.visible = false;

    L.DomEvent.on(labelsButton, 'click', () => {
      if (this.visible) {
        regionLabels.style.display = 'none';
      } else {
        regionLabels.style.display = '';
      }
      this.visible = !this.visible;
    }, this);

    L.DomEvent.disableClickPropagation(container);
    return container;
  },

  _toggleRegionLabels() {

  },
});

export default RegionLabelsControl;
