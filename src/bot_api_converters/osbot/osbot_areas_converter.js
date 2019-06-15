

import Area from '../../model/Area';
import Position from '../../model/Position';
import OSBotConverter from './osbot_converter';

export default class OSBotAreasConverter extends OSBotConverter {
  /*
    API Doc:
        https://osbot.org/api/org/osbot/rs07/api/map/Position.html
        https://osbot.org/api/org/osbot/rs07/api/map/Area.html

        Area(int x1, int y1, int x2, int y2)
        Area(Position southWest, Position northEast)

        Position(int x, int y, int z)
    */
  fromJava(text, areas) {
    areas.removeAll();
    const textNoWhitespace = text.replace(/\s/g, '');
    const areasPattern = `(?:new${this.javaArea}\\((\\d+,\\d+,\\d+,\\d+)\\)|\\(new${this.javaPosition}\\((\\d+,\\d+,\\d)\\),new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)\\))(?:.setPlane\\((\\d)\\))?`;
    const re = new RegExp(areasPattern, 'mg');
    let match;

    do {
      match = re.exec(textNoWhitespace);

      if (match) {
        if (match[1] !== undefined) {
          const z = match[4] !== undefined ? match[4] : 0;
          const values = match[1].split(',');
          areas.add(new Area(new Position(values[0], values[1], z), new Position(values[2], values[3], z)));
        } else {
          const pos1Values = match[2].split(',');
          const pos1Z = match[4] !== undefined ? match[4] : pos1Values[2];

          const pos2Values = match[3].split(',');
          const pos2Z = match[4] !== undefined ? match[4] : pos2Values[2];
          areas.add(
            new Area(
              new Position(pos1Values[0], pos1Values[1], pos1Z),
              new Position(pos2Values[0], pos2Values[1], pos2Z),
            ),
          );
        }
      }
    } while (match);
  }

  toRaw(areas) {
    return areas.areas.map(area => area.toString()).join('\n');
  }

  toJavaSingle(area) {
    let areaDef = `new ${this.javaArea}(${area.toString()})`;
    if (area.startPosition.z > 0) {
      areaDef += `.setPlane(${area.startPosition.z})`;
    }
    return areaDef;
  }

  toJavaArray(areas) {
    if (areas.areas.length === 1) {
      return `${this.javaArea} area = ${this.toJavaSingle(areas.areas[0])};`;
    } if (areas.areas.length > 1) {
      let output = `${this.javaArea}[] area = {\n`;
      for (let i = 0; i < areas.areas.length; i += 1) {
        output += `    ${this.toJavaSingle(areas.areas[i])}`;
        if (i !== areas.areas.length - 1) {
          output += ',';
        }
        output += '\n';
      }
      output += '};';
      return output;
    }
    return '';
  }

  toJavaList(areas) {
    if (areas.areas.length === 1) {
      return `${this.javaArea} area = ${this.toJavaSingle(areas.areas[0])};`;
    } if (areas.areas.length > 1) {
      let output = `List&lt;${this.javaArea}&gt; area = new ArrayList<>();\n`;
      for (let i = 0; i < areas.areas.length; i += 1) {
        output += `area.add(${this.toJavaSingle(areas.areas[i])});\n`;
      }
      return output;
    }
    return '';
  }

  toJavaArraysAsList(areas) {
    if (areas.areas.length === 1) {
      return `${this.javaArea} area = ${this.toJavaSingle(areas.areas[0])};`;
    } if (areas.areas.length > 1) {
      let output = `List&lt;${this.javaArea}&gt; area = Arrays.asList(\n`
                + `    new ${this.javaArea}[]{\n`;

      for (let i = 0; i < areas.areas.length; i += 1) {
        output += `        ${this.toJavaSingle(areas.areas[i])}`;
        if (i !== areas.areas.length - 1) {
          output += ',';
        }
        output += '\n';
      }

      output += '    }\n';
      output += ');';
      return output;
    }
    return '';
  }
}
