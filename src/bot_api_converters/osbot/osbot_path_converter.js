

import Position from '../../model/Position';
import OSBotConverter from './osbot_converter';

export default class OSBotPathConverter extends OSBotConverter {
  /*
    API Doc:
        https://osbot.org/api/org/osbot/rs07/api/map/Position.html

        Position(int x, int y, int z)
    */
  fromJava(text, path) {
    path.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');
    const posPattern = `new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)`;
    const re = new RegExp(posPattern, 'mg');
    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        path.add(new Position(...match[1].split(',')));
      }
    } while (match);
  }

  toRaw(path) {
    return path.positions.map(position => `${position.toString()}`).join('\n');
  }

  toJavaSingle(position) {
    return `${this.javaPosition} position = new ${this.javaPosition}(${position.toString()});`;
  }

  toJavaArray(path) {
    if (path.positions.length === 1) {
      return this.toJavaSingle(path.positions[0]);
    } if (path.positions.length > 1) {
      let output = `${this.javaPosition}[] path = {\n`;
      for (let i = 0; i < path.positions.length; i += 1) {
        output += `    new ${this.javaPosition}(${path.positions[i].x}, ${path.positions[i].y}, ${path.positions[i].z})`;
        if (i !== path.positions.length - 1) output += ',';
        output += '\n';
      }
      output += '};';
      return output;
    }
    return '';
  }

  toJavaList(path) {
    if (path.positions.length === 1) {
      return this.toJavaSingle(path.positions[0]);
    } if (path.positions.length > 1) {
      let output = `List&lt;${this.javaPosition}&gt; path = new ArrayList<>();\n`;
      for (let i = 0; i < path.positions.length; i += 1) {
        output += `path.add(new ${this.javaPosition}(${path.positions[i].x}, ${path.positions[i].y}, ${path.positions[i].z}));\n`;
      }
      return output;
    }
    return '';
  }

  toJavaArraysAsList(path) {
    if (path.positions.length === 1) {
      return this.toJavaSingle(path.positions[0]);
    } if (path.positions.length > 1) {
      let output = `List&lt;${this.javaPosition}&gt; path = Arrays.asList(\n    new ${this.javaPosition}[]{\n`;
      for (let i = 0; i < path.positions.length; i += 1) {
        output += `        new ${this.javaPosition}(${path.positions[i].x}, ${path.positions[i].y}, ${path.positions[i].z})`;
        if (i !== path.positions.length - 1) output += ',';
        output += '\n';
      }
      output += '    }\n);';
      return output;
    }
    return '';
  }
}
