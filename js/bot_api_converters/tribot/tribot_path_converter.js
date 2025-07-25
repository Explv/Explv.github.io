'use strict';

import {Position} from '../../model/Position.js';
import {Path} from '../../model/Path.js';
import {OSBotPathConverter} from '../osbot/osbot_path_converter.js';

export class TRiBotPathConverter extends OSBotPathConverter {

    constructor() {
        super();
        this.javaArea = "RSArea";
        this.javaPosition = "RSTile";
    }
}