

import Position from '../../model/Position';
import OSBotPathConverter from '../osbot/osbot_path_converter';

export default class DreamBotPathConverter extends OSBotPathConverter {
  constructor() {
    super();
    this.javaArea = 'Area';
    this.javaPosition = 'Tile';
  }

  /*
    API Doc:
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Tile.html

    Tile(int x, int y)
    Tile(int x, int y, int z)
    */
  fromJava(text, path) {
    path.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');
    const posPattern = `new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)`;
    const re = new RegExp(posPattern, 'mg');
    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        const values = match[1].split(',');
        const z = values.length === 2 ? 0 : values[2];
        path.add(new Position(values[0], values[1], z));
      }
    } while (match);
  }
}
