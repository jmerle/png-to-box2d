import { Command, flags } from '@oclif/command';
import * as commandExists from 'command-exists';
import * as fs from 'fs-extra';

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
    overwrite: flags.boolean({
      char: 'o',
      description: 'overwrite the output file if it exists',
      default: false,
    }),
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
    // tslint:disable-next-line:no-shadowed-variable
    const { args, flags } = this.parse(Generate);

    if (args.output === Generate.args[1].default) {
      args.output = `${args.input}.json`;
    }

    const requiredCommands = ['convert', 'potrace', 'inkscape', 'mogrify'];
    for (const command of requiredCommands) {
      await this.ensureCommandExists(command);
    }

    const inputExists = await fs.pathExists(args.input);
    if (inputExists) {
      const stat = await fs.stat(args.input);
      if (!stat.isFile()) {
        this.error('The input path does not point to a file', { exit: 1 });
      }
    } else {
      this.error('The input path does not exist', { exit: 1 });
    }

    if (!flags.overwrite) {
      const outputExists = await fs.pathExists(args.output);
      if (outputExists) {
        this.error('The output file already exists, use --overwrite to overwrite it', { exit: 1 });
      }
    }

    this.generateShapeData(args.input, args.output);
  }

  private async ensureCommandExists(command: string): Promise<void> {
    try {
      await commandExists(command);
    } catch (err) {
      this.error(`${command} must be available on your PATH`, { exit: 1 });
    }
  }

  private async generateShapeData(inputPath: string, outputPath: string): Promise<void> {
    this.log(`Input: ${inputPath}`);
    this.log(`Output: ${outputPath}`);
  }
}
