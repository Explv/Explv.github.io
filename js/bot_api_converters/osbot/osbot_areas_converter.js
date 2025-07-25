'use strict';

import {Area} from '../../model/Area.js';
import {Areas} from '../../model/Areas.js';
import {Position} from '../../model/Position.js';
import {OSBotConverter} from './osbot_converter.js';

export class OSBotAreasConverter extends OSBotConverter {
    
    constructor() {
        super();
    }
    
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
        text = text.replace(/\s/g, '');
        var areasPattern = `(?:new${this.javaArea}\\((\\d+,\\d+,\\d+,\\d+)\\)|\\(new${this.javaPosition}\\((\\d+,\\d+,\\d)\\),new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)\\))(?:.setPlane\\((\\d)\\))?`;
        var re = new RegExp(areasPattern,"mg");
        var match;
        while ((match = re.exec(text))) {
            if (match[1] !== undefined) {
                var z = match[4] !== undefined ? match[4] : 0;
                var values = match[1].split(",");
                areas.add(new Area(new Position(values[0], values[1], z), new Position(values[2], values[3], z)));
            } else {
                var pos1Values = match[2].split(",");
                var pos1Z = match[4] !== undefined ? match[4] : pos1Values[2];

                var pos2Values = match[3].split(",");
                var pos2Z = match[4] !== undefined ? match[4] : pos2Values[2];
                areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Z), new Position(pos2Values[0], pos2Values[1], pos2Z)));
            }
        }
    }
    
    toRaw(areas) {
        var output = "";
        for (var i = 0; i < areas.areas.length; i++) {
            output += `${areas.areas[i].startPosition.x},${areas.areas[i].startPosition.y},${areas.areas[i].endPosition.x},${areas.areas[i].endPosition.y}\n`;
        }
        return output;
    }
    
    toJavaSingle(area) {
        var areaDef = `new ${this.javaArea}(${area.startPosition.x}, ${area.startPosition.y}, ${area.endPosition.x}, ${area.endPosition.y})`;
        if (area.startPosition.z > 0) {
            areaDef += `.setPlane(${area.startPosition.z})`;
        }
        return areaDef;
    }
    
    toJavaArray(areas) {
        if (areas.areas.length === 1) {
            return `${this.javaArea} area = ` + this.toJavaSingle(areas.areas[0]) + `;`;
        } else if (areas.areas.length > 1) {
            var output = `${this.javaArea}[] area = {\n`;
            for (var i = 0; i < areas.areas.length; i++) {
                output += "    " + this.toJavaSingle(areas.areas[i]);
                if (i !== areas.areas.length - 1) {
                    output += ",";
                }
                output += "\n";
            }
            output += "};";
            return output;
        }
        return "";
    }
    
    toJavaList(areas) {
        if (areas.areas.length === 1) {
            return `${this.javaArea} area = ` + this.toJavaSingle(areas.areas[0]) + ";";
        } else if (areas.areas.length > 1) {
            var output = `List&lt;${this.javaArea}&gt; area = new ArrayList<>();\n`;
            for (var i = 0; i < areas.areas.length; i++) {
                output += "area.add(" + this.toJavaSingle(areas.areas[i]) + ");\n";
            }
            return output;
        }
        return "";
    }
    
    toJavaArraysAsList(areas) {
        if (areas.areas.length === 1) {
            return `${this.javaArea} area = ` + this.toJavaSingle(areas.areas[0]) + ";";
        } else if (areas.areas.length > 1) {
            var output = `List&lt;${this.javaArea}&gt; area = Arrays.asList(\n` +
                `    new ${this.javaArea}[]{\n`;
            
            for (var i = 0; i < areas.areas.length; i++) {
                output += "        " + this.toJavaSingle(areas.areas[i]);
                if (i !== areas.areas.length - 1) {
                    output += ",";
                }
                output += "\n";
            }
            
            output += "    }\n";
            output += ");";
            return output;
        }
        return "";
    }
}