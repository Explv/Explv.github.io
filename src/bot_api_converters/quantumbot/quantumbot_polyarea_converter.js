

import Position from '../../model/Position';
import OSBotPolyAreaConverter from '../osbot/osbot_polyarea_converter';

export default class QuantumBotPolyAreaConverter extends OSBotPolyAreaConverter {
  constructor() {
    super();
    this.javaArea = 'Area';
    this.javaPosition = 'Tile';
  }

  /*
    API Doc:
        https://quantumbot.org/javadocs/org/quantumbot/api/map/Area.html
        https://quantumbot.org/javadocs/org/quantumbot/api/map/Tile.html

    Area(int[][] points)
    Area(int[][] points, int plane)
    */
  fromJava(text, polyarea) {
    polyarea.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');

    const zPattern = /\},(\d)\)/mg;
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
    output += '\n    }';
    if (polyarea.positions.length > 0 && polyarea.positions[0].z > 0) {
      output += `, ${polyarea.positions[0].z}`;
    }
    output += '\n);';
    return output;
  }
}
