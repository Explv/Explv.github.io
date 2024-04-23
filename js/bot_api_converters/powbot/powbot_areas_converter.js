'use strict';

import {Area} from '../../model/Area.js';
import {Areas} from '../../model/Areas.js';
import {Position} from '../../model/Position.js';
import {OSBotAreasConverter} from '../osbot/osbot_areas_converter.js';

export class PowBotAreasConverter extends OSBotAreasConverter {
    
    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }

        /*
    API Doc:
        https://powbot.org/docs/org.powerbot.script/Area.html
        https://powbot.org/docs/org.powerbot.script/Tile.html

        Area(Positionable tile1, Positionable tile2)
      
        Tile(int x, int y)
        Tile(int x, int y, int plane) 
    */
    
    fromJava(text, areas) {        
        areas.removeAll();
        text = text.replace(/\s/g, '');
        var areasPattern = `(?:new${this.javaArea}\\(new${this.javaPosition}\\((\\d+,\\d+,\\d)\\),new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)\\))`;
        var re = new RegExp(areasPattern,"mg");
        var match;
        while ((match = re.exec(text))) {
            var pos1Values = match[1].split(",");
            var pos2Values = match[2].split(",");
            areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Values[2]), new Position(pos2Values[0], pos2Values[1], pos2Values[2])));
        }
    }
    
    toJavaSingle(area) {
        return `new ${this.javaArea}(new ${this.javaPosition}(${area.startPosition.x}, ${area.startPosition.y}, ${area.startPosition.z}), new ${this.javaPosition}(${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z}))`;
    }
}