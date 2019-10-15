import { Command, flags } from '@oclif/command';
import * as commandExists from 'command-exists';

export default class Generate extends Command {
  public static description = 'convert a PNG image to Box2D shape data';

  // TODO
  public static examples = [
    `$ png-to-box2d generate castle.png
To do
`,
    `$ png-to-box2d generate castle.png castle-shape.json
To do
`,
  ];

  public static flags = {
    help: flags.help({ char: 'h' }),
  };

  public static args = [
    {
      name: 'input',
      description: 'path to PNG image to generate Box2D shape data for',
      required: true,
    },
    {
      name: 'output',
      description: 'where the generated JSON file should be placed',
      default: '{INPUT}.json',
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = this.parse(Generate);

    if (args.output === Generate.args[1].default) {
      args.output = `${args.input}.json`;
    }

    const requiredCommands = ['convert', 'potrace', 'inkscape', 'mogrify'];
    for (const command of requiredCommands) {
      await this.ensureCommandAvailability(command);
    }

    this.log(`Input: ${args.input}`);
    this.log(`Output: ${args.output}`);
  }

  private async ensureCommandAvailability(command: string): Promise<void> {
    try {
      await commandExists(command);
    } catch (err) {
      this.error(`${command} must be available on your PATH`, { exit: 1 });
    }
  }
}
