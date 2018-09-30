'use strict';

import {PolyArea} from '../../model/PolyArea.js';
import {Position} from '../../model/Position.js';
import {OSBotPolyAreaConverter} from '../osbot/osbot_polyarea_converter.js';

export class QuantumBotPolyAreaConverter extends OSBotPolyAreaConverter {

    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }
    
    /*
    API Doc:
        https://quantumbot.org/javadocs/org/quantumbot/api/map/Area.html
        https://quantumbot.org/javadocs/org/quantumbot/api/map/Tile.html

    Area(int[][] points)
    Area(int[][] points, int plane) 
    */
    fromJava(text, polyarea) {
        polyarea.removeAll();
        text = text.replace(/\s/g, '');
        
        var zPattern = /\},(\d)\)/mg;
        var zMatch = zPattern.exec(text);
        var z = zMatch ? zMatch[1] : 0;

        var positionsPattern = /\{(\d+),(\d+)\}/mg;
        var match;
        while ((match = positionsPattern.exec(text))) {
            polyarea.add(new Position(match[1], match[2], z));
        }
    }
    
    toJava(polyarea) {
        if (polyarea.positions.length == 0) {
            return "";
        }
        var output = `${this.javaArea} area = new ${this.javaArea}(\n    new int[][]{`;
        for (var i = 0; i < polyarea.positions.length; i++) {
            output += `\n        { ${polyarea.positions[i].x}, ${polyarea.positions[i].y} }`;
            if (i !== polyarea.positions.length - 1) {
                output += ",";
            }
        }
        output += "\n    }";
        if (polyarea.positions.length > 0 && polyarea.positions[0].z > 0) {
            output += `, ${polyarea.positions[0].z}`;
        }
        output += "\n);";
        return output;
    }
}