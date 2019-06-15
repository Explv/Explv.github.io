import * as L from 'leaflet';

export default class Areas {
  constructor(map) {
    this.map = map;
    this.featureGroup = new L.FeatureGroup();
    this.areas = [];
    this.rectangles = [];
  }

  add(area) {
    this.areas.push(area);
    const rectangle = area.toLeaflet(this.map);
    this.rectangles.push(rectangle);
    this.featureGroup.addLayer(rectangle);
  }

  removeLast() {
    if (this.areas.length > 0) {
      this.areas.pop();
      this.featureGroup.removeLayer(this.rectangles.pop());
    }
  }

  removeAll() {
    while (this.areas.length > 0) {
      this.areas.pop();
      this.featureGroup.removeLayer(this.rectangles.pop());
    }
  }
}
