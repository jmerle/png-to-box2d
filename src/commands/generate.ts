import { flags } from '@oclif/command';
import * as commandExists from 'command-exists';
import * as execa from 'execa';
import * as fs from 'fs-extra';
import { imageSize } from 'image-size';
import * as stringify from 'json-stringify-pretty-compact';
import * as os from 'os';
import * as path from 'path';
import { BaseCommand } from '../BaseCommand';
import { postScriptToShapes } from '../convert/postscript-to-shapes';
import { shapesToTriangulatedShapes } from '../convert/shapes-to-triangulated-shapes';

export default class Generate extends BaseCommand {
  public static description = 'convert a PNG image to Box2D shape data';

  public static examples = [
    `$ png-to-box2d generate images/castle.png
Converted image in images/castle.png to triangulated shapes in images/castle.png.json
`,
    `$ png-to-box2d generate --overwrite --tolerance 5 images/castle.png out/triangles.json
Converted image in images/castle.png to triangulated shapes in out/triangles.json
`,
  ];

  public static flags = {
    ...BaseCommand.flags,
    overwrite: flags.boolean({
      char: 'o',
      description: 'overwrite the output file if it exists',
      default: false,
    }),
    tolerance: flags.option<number>({
      char: 't',
      description: `
path tolerance in px where less tolerance means more triangles per shape
see https://mourner.github.io/simplify-js/ for more information
      `.trim(),
      default: 2.5,
      parse: parseFloat,
    }),
    alpha: flags.option<number>({
      char: 'a',
      description: `
the percentage of when an alpha value should be seen as part of the background
when set to X, every pixel that has a transparency of at least X% will be seen as part of the background
      `.trim(),
      default: 25,
      parse: parseFloat,
    }),
    path: flags.boolean({
      char: 'p',
      description: 'include the full paths of the shapes in the generated json file',
      default: false,
    }),
    beautify: flags.boolean({
      char: 'b',
      description: 'beautify the generated json file',
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
    if (this.args.output === Generate.args[1].default) {
      this.args.output = `${this.args.input}.json`;
    }

    if (this.flags.tolerance < 0.01) {
      this.err('Tolerance should be at least 0.01');
    }

    if (this.flags.alpha < 0) {
      this.err('Alpha threshold should be at least 0');
    }

    if (this.flags.alpha > 100) {
      this.err('Alpha threshold should not be greater than 100');
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

    await this.generateShapeData(this.args.input, this.args.output, this.flags.tolerance, 100 - this.flags.alpha);
  }

  private async ensureCommandExists(command: string): Promise<void> {
    try {
      await commandExists(command);
    } catch (err) {
      this.err(`${command} must be available on your PATH`);
    }
  }

  // Most of the logic in this method comes from https://github.com/anko/image-to-box2d-body
  private async generateShapeData(
    inputPath: string,
    outputPath: string,
    tolerance: number,
    alphaTreshold: number,
  ): Promise<void> {
    this.info(`input: ${inputPath}, output: ${outputPath}, tolerance: ${tolerance}, alpha treshold: ${alphaTreshold}`);

    // Extract the alpha channel into a separate image
    const alphaPath = this.getTempPath(inputPath, 'alpha.png');
    await this.executeCommand('convert', inputPath, '-alpha', 'extract', alphaPath);

    // Threshold and negate the alpha channel image. Also convert to the (extremely simple
    // and text-based) PPM image format, because that's what potrace understands.
    const thresholdedAlphaPath = this.getTempPath(inputPath, 'tresholded-alpha.ppm');
    await this.executeCommand(
      'convert',
      alphaPath,
      '-threshold',
      `${alphaTreshold}%%`,
      '-negate',
      thresholdedAlphaPath,
    );

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
    this.info(`Converting ${tracedPath} to shape paths`);
    const shapes = await postScriptToShapes(tracedPath, shapesPath, tolerance);

    // Convert the shape data into triangle data
    this.info(`Converting shape paths to triangulated shapes`);
    const triangles = await shapesToTriangulatedShapes(shapes);

    const inputDimensions = await imageSize(inputPath);

    const data: any = {
      width: inputDimensions.width,
      height: inputDimensions.height,
      shapes: triangles,
    };

    if (this.flags.path) {
      const paths: Point[][] = [];

      for (const shape of shapes) {
        const currentPath: Point[] = [];

        if (shape.mainPath !== null) {
          for (const point of shape.mainPath) {
            currentPath.push({
              x: point.x,
              y: point.y,
            });
          }
        }

        currentPath.push(currentPath[0]);
        paths.push(currentPath);
      }

      data.paths = paths;
    }

    let outputContent = this.flags.beautify ? stringify(data) : JSON.stringify(data);
    outputContent = outputContent.trim() + '\n';

    await fs.ensureFile(outputPath);
    await fs.writeFile(outputPath, outputContent);
    this.log(`Converted image in ${inputPath} to triangulated shapes in ${outputPath}`);
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
