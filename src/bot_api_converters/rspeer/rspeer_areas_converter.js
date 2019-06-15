

import Area from '../../model/Area';
import Position from '../../model/Position';
import OSBotAreasConverter from '../osbot/osbot_areas_converter';

export default class RSPeerAreasConverter extends OSBotAreasConverter {
  constructor() {
    super();
    this.javaArea = 'Area';
    this.javaPosition = 'Position';
  }

  /*
    API Doc:
        https://rspeer.org/javadocs/org/rspeer/runetek/api/movement/position/Area.html
        https://rspeer.org/javadocs/org/rspeer/runetek/api/movement/position/Position.html

    Area.rectangular(int minX, int minY, int maxX, int maxY)
    Area.rectangular(int minX, int minY, int maxX, int maxY, int floorLevel)
    Area.rectangular(Position start, Position end)
    Area.rectangular(Position start, Position end, int floorLevel)

    Position(int worldX, int worldY)
    Position(int worldX, int worldY, int floorLevel)
    */
  fromJava(text, areas) {
    areas.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');

    const areasPattern = '(?:'
                               + `${this.javaArea}\\.rectangular`
                                   + '\\((\\d+,\\d+,\\d+,\\d+(?:,\\d+)?)\\)'
                                   + '|'
                                   + `\\(new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\),new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)(?:,(\\d+))?\\)`
                           + ')';
    const re = new RegExp(areasPattern, 'mg');
    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        if (match[1] !== undefined) {
          const values = match[1].split(',');
          const z = values.length === 4 ? 0 : values[4];
          areas.add(new Area(new Position(values[0], values[1], z), new Position(values[2], values[3], z)));
        } else {
          const pos1Values = match[2].split(',');
          let pos1Z = pos1Values.length === 2 ? 0 : pos1Values[2];

          const pos2Values = match[3].split(',');
          let pos2Z = pos2Values.length === 2 ? 0 : pos2Values[2];

          if (match[4] !== undefined) {
            pos1Z = match[4];
            pos2Z = match[4];
          }

          areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Z), new Position(pos2Values[0], pos2Values[1], pos2Z)));
        }
      }
    } while (match);
  }

  toJavaSingle(area) {
    if (area.startPosition.z === 0) {
      return `${this.javaArea}.rectangular(${area.startPosition.x}, ${area.startPosition.y}, ${area.endPosition.x}, ${area.endPosition.y})`;
    }
    return `${this.javaArea}.rectangular(${area.startPosition.x}, ${area.startPosition.y}, ${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z})`;
  }
}
