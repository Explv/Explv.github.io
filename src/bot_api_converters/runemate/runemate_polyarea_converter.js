

import Position from '../../model/Position';
import OSBotPolyAreaConverter from '../osbot/osbot_polyarea_converter';

export default class RuneMatePolyAreaConverter extends OSBotPolyAreaConverter {
  constructor() {
    super();
    this.javaArea = 'Area';
    this.javaPosition = 'Coordinate';
  }

  fromJava(text, polyarea) {
    polyarea.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');

    const positionsPattern = `new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)`;
    const re = new RegExp(positionsPattern, 'mg');

    let match;
    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        const values = match[1].split(',');
        const z = values.length === 2 ? 0 : values[2];
        polyarea.add(new Position(values[0], values[1], z));
      }
    } while (match);
  }

  toJava(polyarea) {
    if (polyarea.positions.length === 0) {
      return '';
    }
    let output = `${this.javaArea} area = new ${this.javaArea}.Polygonal(`;
    for (let i = 0; i < polyarea.positions.length; i += 1) {
      const position = polyarea.positions[i];
      output += `\n    new ${this.javaPosition}(${position.x}, ${position.y}, ${position.z})`;
      if (i !== polyarea.positions.length - 1) {
        output += ',';
      }
    }
    output += '\n);';
    return output;
  }
}
