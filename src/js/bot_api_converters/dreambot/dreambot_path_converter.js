'use strict';

import {Position} from '../../model/Position.js';
import {Path} from '../../model/Path.js';
import {OSBotPathConverter} from '../osbot/osbot_path_converter.js';

export class DreamBotPathConverter extends OSBotPathConverter {

    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }
    
    /*
    API Doc:
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Tile.html

    Tile(int x, int y) 
    Tile(int x, int y, int z)
    */
    fromJava(text, path) {
        path.removeAll();
        text = text.replace(/\s/g, '');
        var posPattern = `new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)`;
        var re = new RegExp(posPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            var values = match[1].split(",");
            var z = values.length == 2 ? 0 : values[2];
            path.add(new Position(values[0], values[1], z));
        }
    }
}