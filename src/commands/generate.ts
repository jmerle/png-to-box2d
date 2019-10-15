import { Command, flags } from '@oclif/command';
import * as commandExists from 'command-exists';
import * as execa from 'execa';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { postScriptToShapes } from '../generate/postscript-to-shapes';
import { shapesToTriangles } from '../generate/shapes-to-triangles';

export default class Generate extends Command {
  public static description = 'convert a PNG image to Box2D shape data';

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

    await this.ensureCommandExists('convert');
    await this.ensureCommandExists('potrace');

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

    await this.generateShapeData(args.input, args.output);
  }

  private async ensureCommandExists(command: string): Promise<void> {
    try {
      await commandExists(command);
    } catch (err) {
      this.error(`${command} must be available on your PATH`, { exit: 1 });
    }
  }

  // The logic in this method comes from https://github.com/anko/image-to-box2d-body
  private async generateShapeData(inputPath: string, outputPath: string): Promise<void> {
    // Extract the alpha channel into a separate image
    const alphaPath = this.getTempPath(inputPath, 'alpha.png');
    await this.executeCommand('convert', inputPath, '-alpha', 'extract', alphaPath);

    // Threshold and negate the alpha channel image. Also convert to the (extremely simple
    // and text-based) PPM image format, because that's what potrace understands.
    const thresholdedAlphaPath = this.getTempPath(inputPath, 'tresholded-alpha.ppm');
    await this.executeCommand('convert', alphaPath, '-threshold', '75%%', '-negate', thresholdedAlphaPath);

    // Trace thresholded image into a PostScript file, using the most verbose,
    // least-compressed options available. This makes it easier to parse later.
    const tracedPath = this.getTempPath(inputPath, 'traced.ps');
    await this.executeCommand(
      'potrace',
      '--longcoding',
      '--cleartext',
      '--alphamax',
      '0',
      '--output',
      tracedPath,
      thresholdedAlphaPath,
    );

    // Parse the traced PostScript file and convert it to a JSON format of shapes
    const shapesPath = this.getTempPath(inputPath, 'shapes.json');
    this.log(`Converting ${tracedPath} to shapes in ${shapesPath}`);
    await postScriptToShapes(tracedPath, shapesPath);

    // Convert the shape JSON data into triangle JSON data
    this.log(`Converting ${shapesPath} to triangle shapes in ${outputPath}`);
    await fs.ensureFile(outputPath);
    await shapesToTriangles(shapesPath, outputPath);
  }

  private async executeCommand(command: string, ...args: string[]): Promise<void> {
    let cmd = command;
    if (args.length > 0) {
      cmd += ' ' + args.join(' ');
    }

    this.log(`$ ${cmd}`);

    try {
      await execa(command, args);
    } catch (err) {
      this.error(err.stderr, { exit: 1 });
    }
  }

  private getTempPath(inputPath: string, tempFilename: string): string {
    const inputFilename = path.basename(inputPath, path.extname(inputPath));
    const filename = `${inputFilename}-${tempFilename}`;
    return path.resolve(os.tmpdir(), filename);
  }
}
