import { Command, flags } from '@oclif/command';
import * as commandExists from 'command-exists';
import * as execa from 'execa';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { BaseCommand } from '../BaseCommand';
import { postScriptToShapes } from '../generate/postscript-to-shapes';
import { shapesToTriangles } from '../generate/shapes-to-triangles';

export default class Generate extends BaseCommand {
  public static description = 'convert a PNG image to Box2D shape data';

  public static flags = {
    ...BaseCommand.flags,
    overwrite: flags.boolean({
      char: 'o',
      description: 'overwrite the output file if it exists',
      default: false,
    }),
    tolerance: flags.option<number>({
      char: 't',
      description: 'path tolerance in px where less tolerance means more triangles per shape',
      default: 2.5,
      parse: parseFloat,
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
    if (this.args.output === Generate.args[1].default) {
      this.args.output = `${this.args.input}.json`;
    }

    if (this.flags.tolerance < 0.01) {
      this.err('Tolerance should be at least 0.01');
    }

    await this.ensureCommandExists('convert');
    await this.ensureCommandExists('potrace');

    const inputExists = await fs.pathExists(this.args.input);
    if (inputExists) {
      const stat = await fs.stat(this.args.input);
      if (!stat.isFile()) {
        this.err('The input path does not point to a file');
      }
    } else {
      this.err('The input path does not exist');
    }

    if (!this.flags.overwrite) {
      const outputExists = await fs.pathExists(this.args.output);
      if (outputExists) {
        this.err('The output file already exists, use --overwrite to overwrite it');
      }
    }

    await this.generateShapeData(this.args.input, this.args.output, this.flags.tolerance);
  }

  private async ensureCommandExists(command: string): Promise<void> {
    try {
      await commandExists(command);
    } catch (err) {
      this.err(`${command} must be available on your PATH`);
    }
  }

  // Most of the logic in this method comes from https://github.com/anko/image-to-box2d-body
  private async generateShapeData(inputPath: string, outputPath: string, tolerance: number): Promise<void> {
    this.info(`input: ${inputPath}, output: ${outputPath}, tolerance: ${tolerance}`);

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

    // Parse the traced PostScript file and convert it to a JSON file containing all shapes
    const shapesPath = this.getTempPath(inputPath, 'shapes.json');
    this.info(`Converting ${tracedPath} to shapes in ${shapesPath}`);
    await postScriptToShapes(tracedPath, shapesPath, tolerance);

    // Convert the shape data into triangle data
    this.info(`Converting ${shapesPath} to triangle shapes in ${outputPath}`);
    await fs.ensureFile(outputPath);
    await shapesToTriangles(shapesPath, outputPath);

    this.log(`Converted image in ${inputPath} to triangles in ${outputPath}`);
  }

  private async executeCommand(command: string, ...args: string[]): Promise<void> {
    let cmd = command;
    if (args.length > 0) {
      cmd += ' ' + args.join(' ');
    }

    this.info(`$ ${cmd}`);

    try {
      await execa(command, args);
    } catch (err) {
      this.err(`Something went wrong while running '${cmd}'`, false);
      this.err(err.stderr);
    }
  }

  private getTempPath(inputPath: string, tempFilename: string): string {
    const inputFilename = path.basename(inputPath, path.extname(inputPath));
    const filename = `${inputFilename}-${tempFilename}`;
    return path.resolve(os.tmpdir(), filename);
  }
}
