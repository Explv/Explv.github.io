

import DreamBotPathConverter from '../dreambot/dreambot_path_converter';

export default class RSPeerPathConverter extends DreamBotPathConverter {
  constructor() {
    super();
    this.javaArea = 'Area.rectangular';
    this.javaPosition = 'Position';
  }
}
