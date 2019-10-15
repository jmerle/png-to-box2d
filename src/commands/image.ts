import { Command, flags } from '@oclif/command';

export default class Image extends Command {
  public static description = 'convert generated Box2D shape data to an image for debugging';

  public static examples = [
    `$ png-to-box2d image
To do
`,
  ];

  public static flags = {
    help: flags.help({ char: 'h' }),
  };

  public static args = [{ name: 'file' }];

  public async run(): Promise<void> {
    const { args, flags } = this.parse(Image);

    this.log('To do');
  }
}
