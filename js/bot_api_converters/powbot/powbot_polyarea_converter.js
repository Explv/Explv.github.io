'use strict';

import {PolyArea} from '../../model/PolyArea.js';
import {Position} from '../../model/Position.js';
import {OSBotPolyAreaConverter} from '../osbot/osbot_polyarea_converter.js';

export class PowBotPolyAreaConverter extends OSBotPolyAreaConverter {

    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }
    
    fromJava(text, polyarea) {
        polyarea.removeAll();
        text = text.replace(/\s/g, '');

        var positionsPattern = `new${this.javaPosition}\\((\\d+),(\\d+),(\\d)\\)`;
        var re = new RegExp(positionsPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            polyarea.add(new Position(match[1], match[2], match[3]));
        }
    }
    
    toJava(polyarea) {
        if (polyarea.positions.length == 0) {
            return "";
        }
        var output = `${this.javaArea} area = new ${this.javaArea}(\n    new ${this.javaPosition}[] {`;
        for (var i = 0; i < polyarea.positions.length; i++) {
            var position = polyarea.positions[i];
            output += `\n        new ${this.javaPosition}(${position.x}, ${position.y}, ${position.z})`;
            if (i !== polyarea.positions.length - 1) {
                output += ",";
            }
        }
        output += "\n    }\n);";
        return output;
    }
}