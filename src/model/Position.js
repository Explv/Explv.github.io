import * as L from 'leaflet';

export const MAP_HEIGHT_PX = 296704; // Total height of the map in px at max zoom level
export const RS_TILE_WIDTH_PX = 32; // Width in px of an rs tile at max zoom level
export const RS_TILE_HEIGHT_PX = 32; // Height in px of an rs tile at max zoom level
export const RS_OFFSET_X = 1152; // Amount to offset x coordinate to get correct value
export const RS_OFFSET_Y = 8328; // Amount to offset y coordinate to get correct value

export default class Position {
  constructor(x, y, z) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.z = z;
  }

  static fromLatLng(map, latLng, z) {
    const point = map.project(latLng, map.getMaxZoom());
    let y = MAP_HEIGHT_PX - point.y + (RS_TILE_HEIGHT_PX / 4);
    y = Math.round((y - RS_TILE_HEIGHT_PX) / RS_TILE_HEIGHT_PX) + RS_OFFSET_Y;
    const x = Math.round((point.x - RS_TILE_WIDTH_PX) / RS_TILE_WIDTH_PX) + RS_OFFSET_X;
    return new Position(x, y, z);
  }

  toLatLng(map) {
    return Position.toLatLng(map, this.x, this.y);
  }

  toCentreLatLng(map) {
    return Position.toLatLng(map, this.x + 0.5, this.y + 0.5);
  }

  static toLatLng(map, x, y) {
    const pointX = ((x - RS_OFFSET_X) * RS_TILE_WIDTH_PX) + (RS_TILE_WIDTH_PX / 4);
    const pointY = (MAP_HEIGHT_PX - ((y - RS_OFFSET_Y) * RS_TILE_HEIGHT_PX));
    return map.unproject(L.point(pointX, pointY), map.getMaxZoom());
  }

  getDistance(position) {
    const diffX = Math.abs(this.x - position.x);
    const diffY = Math.abs(this.y - position.y);
    return Math.sqrt((diffX * diffX) + (diffY * diffY));
  }

  toLeaflet(map) {
    const startLatLng = this.toLatLng(map);
    const endLatLng = new Position(this.x + 1, this.y + 1, this.z).toLatLng(map);

    return L.rectangle(L.latLngBounds(startLatLng, endLatLng), {
      color: '#33b5e5',
      fillColor: '#33b5e5',
      fillOpacity: 1.0,
      weight: 1,
      interactive: false,
    });
  }

  equals(position) {
    return this.x === position.x && this.y === position.y && this.z === position.z;
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}
