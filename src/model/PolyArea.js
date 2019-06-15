
import * as L from 'leaflet';

export default class PolyArea {
  constructor(map) {
    this.map = map;
    this.positions = [];
    this.polygon = undefined;
    this.featureGroup = new L.FeatureGroup();
  }

  add(position) {
    this.positions.push(position);
    this.featureGroup.removeLayer(this.polygon);
    this.polygon = this.toLeaflet();
    this.featureGroup.addLayer(this.polygon);
  }

  addAll(positions) {
    this.positions.push(...positions);
    this.featureGroup.removeLayer(this.polygon);
    this.polygon = this.toLeaflet();
    this.featureGroup.addLayer(this.polygon);
  }

  removeLast() {
    if (this.positions.length > 0) {
      this.positions.pop();
      this.featureGroup.removeLayer(this.polygon);
    }

    if (this.positions.length === 0) {
      this.polygon = undefined;
    } else {
      this.polygon = this.toLeaflet();
      this.featureGroup.addLayer(this.polygon);
    }
  }

  removeAll() {
    this.positions = [];
    this.featureGroup.removeLayer(this.polygon);
    this.polygon = undefined;
  }

  isEmpty() {
    return this.positions.length === 0;
  }

  toLeaflet() {
    const latLngs = this.positions.map(
      position => position.toLatLng(this.map),
    );

    return L.polygon(
      latLngs, {
        color: '#33b5e5',
        weight: 1,
        interactive: false,
      },
    );
  }
}
