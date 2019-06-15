

import Area from '../../model/Area';
import Position from '../../model/Position';
import OSBotAreasConverter from '../osbot/osbot_areas_converter';

export default class RuneMateAreasConverter extends OSBotAreasConverter {
  constructor() {
    super();
    this.javaArea = 'Area';
    this.javaPosition = 'Coordinate';
  }

  fromJava(text, areas) {
    areas.removeAll();

    const textNoWhitespace = text.replace(/\s/g, '');

    const areasPattern = '(?:'
                             + `${this.javaArea}\\.Rectangular`
                             + `\\(new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\),new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)(?:,(\\d+))?\\)`
                        + ')';
    const re = new RegExp(areasPattern, 'mg');

    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        const pos1Values = match[1].split(',');

        if (pos1Values.length === 2) {
          pos1Values.push(0);
        }

        const pos2Values = match[2].split(',');

        if (pos2Values.length === 2) {
          pos2Values.push(0);
        }

        if (match[4] !== undefined) {
          pos1Values[2] = match[4];
          pos1Values[2] = match[4];
        }

        areas.add(
          new Area(
            new Position(...pos1Values),
            new Position(...pos2Values),
          ),
        );
      }
    } while (match);
  }

  toJavaSingle(area) {
    return `new ${this.javaArea}.Rectangular(`
               + `new ${this.javaPosition}(${area.startPosition.x}, ${area.startPosition.y}, ${area.startPosition.z}), `
               + `new ${this.javaPosition}(${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z})`
               + ')';
  }
}
