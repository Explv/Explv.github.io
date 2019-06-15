

import Position from '../../model/Position';
import OSBotConverter from './osbot_converter';

export default class OSBotPolyAreaConverter extends OSBotConverter {
  /*
    API Doc:
        https://osbot.org/api/org/osbot/rs07/api/map/Area.html

        Area(int[][] positions)
        Area(Position[] positions)
    */
  fromJava(text, polyarea) {
    polyarea.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');

    const zPattern = /.setPlane\(\d\)/mg;
    const zMatch = zPattern.exec(text);
    const z = zMatch ? zMatch[1] : 0;

    const positionsPattern = /\{(\d+),(\d+)\}/mg;
    let match;

    do {
      match = positionsPattern.exec(textNoWhitespace);

      if (match) {
        polyarea.add(new Position(match[1], match[2], z));
      }
    } while (match);
  }

  toRaw(polyarea) {
    return polyarea.positions
      .map(position => `${position.x},${position.y}`)
      .join('n');
  }

  toJava(polyarea) {
    if (polyarea.positions.length === 0) {
      return '';
    }
    let output = `${this.javaArea} area = new ${this.javaArea}(\n    new int[][]{`;
    for (let i = 0; i < polyarea.positions.length; i += 1) {
      output += `\n        { ${polyarea.positions[i].x}, ${polyarea.positions[i].y} }`;
      if (i !== polyarea.positions.length - 1) {
        output += ',';
      }
    }
    output += '\n    }\n)';
    if (polyarea.positions.length > 0 && polyarea.positions[0].z > 0) {
      output += `.setPlane(${polyarea.positions[0].z})`;
    }
    output += ';';
    return output;
  }
}
