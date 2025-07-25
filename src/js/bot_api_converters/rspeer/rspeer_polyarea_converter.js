'use strict';

import {PolyArea} from '../../model/PolyArea.js';
import {Position} from '../../model/Position.js';
import {OSBotPolyAreaConverter} from '../osbot/osbot_polyarea_converter.js';

export class RSPeerPolyAreaConverter extends OSBotPolyAreaConverter {

    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Position";
    }
    
    /*
    API Doc:
        https://rspeer.org/javadocs/org/rspeer/runetek/api/movement/position/Area.html
        https://rspeer.org/javadocs/org/rspeer/runetek/api/movement/position/Position.html

    Area.polygonal(int floorLevel, Position... tiles) 
    Area.polygonal(Position... tiles) 
    
    Position(int worldX, int worldY)
    Position(int worldX, int worldY, int floorLevel)
    */
    fromJava(text, polyarea) {
        polyarea.removeAll();
        text = text.replace(/\s/g, '');
        
        var floorLevelPattern = `${this.javaArea}\\.polygonal\\((\\d),`;
        var re = new RegExp(floorLevelPattern, "mg");
        var match = re.exec(text);
        
        var floorLevel = undefined;
        
        if (match) {
            floorLevel = match[1];    
        }

        var positionsPattern = `new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)`;
        var re = new RegExp(positionsPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            var values = match[1].split(",");
            
            var z = values.length == 2 ? 0 : values[2];
            
            if (floorLevel !== undefined) {
                z = floorLevel;
            }
            
            polyarea.add(new Position(values[0], values[1], z));
        }
    }
    
    toJava(polyarea) {
        if (polyarea.positions.length == 0) {
            return "";
        }
        var output = `${this.javaArea} area = ${this.javaArea}.polygonal(\n    new ${this.javaPosition}[] {`;
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