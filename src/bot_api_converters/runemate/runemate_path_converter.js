
import DreamBotPathConverter from '../dreambot/dreambot_path_converter';

export default class RuneMatePathConverter extends DreamBotPathConverter {
  constructor() {
    super();
    this.javaArea = 'Area.Rectangular';
    this.javaPosition = 'Coordinate';
  }
}
