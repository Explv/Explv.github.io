'use strict';

import {Position} from '../../model/Position.js';
import {Path} from '../../model/Path.js';
import {DreamBotPathConverter} from '../dreambot/dreambot_path_converter.js';

export class RuneLitePathConverter extends DreamBotPathConverter {

    constructor() {
        super();
        this.javaArea = "WorldArea";
        this.javaPosition = "WorldPoint";
    }
}