
import Position from '../../model/Position';
import OSBotPolyAreaConverter from '../osbot/osbot_polyarea_converter';

export default class TRiBotPolyAreaConverter extends OSBotPolyAreaConverter {
  constructor() {
    super();
    this.javaArea = 'RSArea';
    this.javaPosition = 'RSTile';
  }

  /*
    API Doc:
        https://tribot.org/doc/org/tribot/api2007/types/RSTile.html
        https://tribot.org/doc/org/tribot/api2007/types/RSArea.html

        RSArea(Positionable[] tiles)
    */
  fromJava(text, polyarea) {
    polyarea.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');

    const positionsPattern = `new${this.javaPosition}\\((\\d+),(\\d+),(\\d)\\)`;
    const re = new RegExp(positionsPattern, 'mg');
    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        polyarea.add(new Position(match[1], match[2], match[3]));
      }
    } while (match);
  }

  toJava(polyarea) {
    if (polyarea.positions.length === 0) {
      return '';
    }
    let output = `${this.javaArea} area = new ${this.javaArea}(\n    new ${this.javaPosition}[] {`;
    for (let i = 0; i < polyarea.positions.length; i += 1) {
      const position = polyarea.positions[i];
      output += `\n        new ${this.javaPosition}(${position.x}, ${position.y}, ${position.z})`;
      if (i !== polyarea.positions.length - 1) {
        output += ',';
      }
    }
    output += '\n    }\n);';
    return output;
  }
}
