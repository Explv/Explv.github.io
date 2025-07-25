'use strict';

import {Position} from './Position.js';

class Locations {

    constructor() {
        this.locations = [];    
    }
    
    getLocations(callback) {
        if (this.locations.length > 0) {
            callback(this.locations);
            return;
        }
        
        $.ajax({
            url: "resources/map_labels.json",
            dataType: "json",
            context: this,
            success: function( data ) {
                for (var i = 0; i < data.length; i++) {
                    this.locations.push({
                        "name": data[i].name,
                        "position": new Position(data[i].worldX, data[i].worldY, data[i].plane),
                        "size": data[i].textScale,
                        "color": data[i].textColor
                    });
                }
                
                callback(this.locations);
            }
        });
    }
}

export default (new Locations);