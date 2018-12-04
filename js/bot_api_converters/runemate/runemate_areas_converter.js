'use strict';

import {Area} from '../../model/Area.js';
import {Areas} from '../../model/Areas.js';
import {Position} from '../../model/Position.js';
import {OSBotAreasConverter} from '../osbot/osbot_areas_converter.js';

export class RuneMateAreasConverter extends OSBotAreasConverter {
    
    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Coordinate";
    }
    
    fromJava(text, areas) {        
        areas.removeAll();
        text = text.replace(/\s/g, '');
        
        var areasPattern = ``
        
        var areasPattern = `(?:` +
                               `${this.javaArea}\\.Rectangular` + 
                                   `\\(new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\),new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)(?:,(\\d+))?\\)` +
                           `)`;
        var re = new RegExp(areasPattern,"mg");
        var match;
        while ((match = re.exec(text))) {
            
            var pos1Values = match[1].split(",");
            var pos1Z = pos1Values.length == 2 ? 0 : pos1Values[2];

            var pos2Values = match[2].split(",");
            var pos2Z = pos2Values.length == 2 ? 0 : pos2Values[2];
                
            if (match[4] !== undefined) {
                pos1Z = match[4];
                pos2Z = match[4];
            }
                
            areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Z), new Position(pos2Values[0], pos2Values[1], pos2Z)));
        }
    }
    
    toJavaSingle(area) {
        return `new ${this.javaArea}.Rectangular(` +
               `new ${this.javaPosition}(${area.startPosition.x}, ${area.startPosition.y}, ${area.startPosition.z}), ` +
               `new ${this.javaPosition}(${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z})` +
               `)`;
    }
}