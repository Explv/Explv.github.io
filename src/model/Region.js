import Position from './Position';

export const MIN_X = 1152;
export const MAX_X = 3904;
export const MIN_Y = 2496;
export const MAX_Y = 10432;
export const REGION_WIDTH = 64;
export const REGION_HEIGHT = 64;

export class Region {
  constructor(id) {
    this.id = id;
  }

  static fromPosition(position) {
    return Region.fromCoordinates(position.x, position.y);
  }

  static fromCoordinates(x, y) {
    const regionID = (x >> 6) * 256 + (y >> 6);
    return new Region(regionID);
  }

  toCentrePosition() {
    const position = this.toPosition();
    position.x += REGION_WIDTH / 2;
    position.y += REGION_HEIGHT / 2;
    return position;
  }

  toPosition() {
    const x = (this.id >> 8) << 6;
    const y = (this.id & 0xFF) << 6;
    return new Position(x, y, 0);
  }
}
