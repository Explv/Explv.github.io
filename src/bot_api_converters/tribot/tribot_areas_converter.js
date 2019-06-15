
import Area from '../../model/Area';
import Position from '../../model/Position';
import OSBotAreasConverter from '../osbot/osbot_areas_converter';

export default class TRiBotAreasConverter extends OSBotAreasConverter {
  constructor() {
    super();
    this.javaArea = 'RSArea';
    this.javaPosition = 'RSTile';
  }

  /*
    API Doc:
        https://tribot.org/doc/org/tribot/api2007/types/RSTile.html
        https://tribot.org/doc/org/tribot/api2007/types/RSArea.html

        RSArea(Positionable tile1, Positionable tile2)

        RSTile(int x, int y)
        RSTile(int x, int y, int plane)
    */
  fromJava(text, areas) {
    areas.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');

    const areasPattern = `(?:new${this.javaArea}\\(new${this.javaPosition}\\((\\d+,\\d+,\\d)\\),new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)\\))`;
    const re = new RegExp(areasPattern, 'mg');

    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        areas.add(
          new Area(
            new Position(...match[1].split(',')),
            new Position(...match[2].split(',')),
          ),
        );
      }
    } while (match);
  }

  toJavaSingle(area) {
    return `new ${this.javaArea}(new ${this.javaPosition}(${area.startPosition.x}, ${area.startPosition.y}, ${area.startPosition.z}), new ${this.javaPosition}(${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z}))`;
  }
}
