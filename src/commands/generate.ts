import { Command, flags } from '@oclif/command';

export default class Generate extends Command {
  public static description = 'convert one or more PNG images to Box2D shape data';

  public static examples = [
    `$ png-to-box2d generate
To do
`,
  ];

  public static flags = {
    help: flags.help({ char: 'h' }),
  };

  public static args = [{ name: 'file' }];

  public async run(): Promise<void> {
    const { args, flags } = this.parse(Generate);

    this.log('To do');
  }
}
