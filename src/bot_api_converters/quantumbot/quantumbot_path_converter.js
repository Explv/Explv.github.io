

import OSBotPathConverter from '../osbot/osbot_path_converter';

export default class QuantumBotPathConverter extends OSBotPathConverter {
  constructor() {
    super();
    this.javaArea = 'Area';
    this.javaPosition = 'Tile';
  }
}
