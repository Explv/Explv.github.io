
import OSBotPathConverter from '../osbot/osbot_path_converter';

export default class TRiBotPathConverter extends OSBotPathConverter {
  constructor() {
    super();
    this.javaArea = 'RSArea';
    this.javaPosition = 'RSTile';
  }
}
