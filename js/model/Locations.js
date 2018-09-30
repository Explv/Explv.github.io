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
            url: "resources/locations.json",
            dataType: "json",
            context: this,
            success: function( data ) {
                var locations = data["locations"];
                
                for (var i in locations) {
                    this.locations.push({
                        "name": locations[i].name,
                        "position": new Position(locations[i].coords[0], locations[i].coords[1], locations[i].coords[2])
                    });
                }
                
                callback(this.locations);
            }
        });
    }
}

export default (new Locations);