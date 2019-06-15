import * as L from 'leaflet';

import Position from './Position';

export default class Area {
  constructor(startPosition, endPosition) {
    this.startPosition = startPosition;
    this.endPosition = endPosition;
  }

  static fromBounds(map, bounds) {
    return new Area(
      map,
      Position.fromLatLng(map, bounds.getSouthWest()),
      Position.fromLatLng(map, bounds.getNorthEast()),
    );
  }

  toLeaflet(map) {
    const newStartPosition = new Position(this.startPosition.x, this.startPosition.y, this.startPosition.z);
    const newEndPosition = new Position(this.endPosition.x, this.endPosition.y, this.startPosition.z);

    if (this.endPosition.x >= this.startPosition.x) {
      newEndPosition.x += 1;
    } else {
      newStartPosition.x += 1;
    }

    if (this.endPosition.y >= this.startPosition.y) {
      newEndPosition.y += 1;
    } else {
      newStartPosition.y += 1;
    }

    return L.rectangle(
      L.latLngBounds(
        newStartPosition.toLatLng(map),
        newEndPosition.toLatLng(map),
      ), {
        color: '#33b5e5',
        weight: 1,
        interactive: false,
      },
    );
  }

  toString() {
    return `(${this.startPosition.x}, ${this.startPosition.y}, ${this.endPosition.x}, ${this.endPosition.y})`;
  }
}
