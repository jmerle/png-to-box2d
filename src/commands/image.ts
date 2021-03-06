import { flags } from '@oclif/command';
import { createCanvas } from 'canvas';
import * as fs from 'fs-extra';
import { BaseCommand } from '../BaseCommand';

export default class Image extends BaseCommand {
  public static description = 'convert generated Box2D shape data to an image for debugging';

  public static examples = [
    `$ png-to-box2d image out/triangles.json out/image.png
Converted triangulated shapes in out/triangles.json to image in out/image.png
`,
  ];

  public static flags = {
    ...BaseCommand.flags,
    overwrite: flags.boolean({
      char: 'o',
      description: 'overwrite the output file if it exists',
      default: false,
    }),
  };

  public static args = [
    {
      name: 'input',
      description: 'path to JSON file containing shape data generated by the `generate` command',
      required: true,
    },
    {
      name: 'output',
      description: 'where the generated PNG image should be placed',
      required: true,
    },
  ];

  public async run(): Promise<void> {
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

    await this.generateImage(this.args.input, this.args.output);
  }

  private async generateImage(inputPath: string, outputPath: string): Promise<void> {
    this.info(`input: ${inputPath}, output: ${outputPath}`);

    const inputBuffer = await fs.readFile(inputPath);
    const inputData = JSON.parse(inputBuffer.toString());
    const shapes: Array<Array<[Point, Point, Point]>> = inputData.shapes;

    const width =
      inputData.width ||
      Math.max(
        ...shapes.map(triangleList => {
          return Math.max(
            ...triangleList.map(triangle => {
              return Math.max(...triangle.map(point => point.x));
            }),
          );
        }),
      );

    const height =
      inputData.height ||
      Math.max(
        ...shapes.map(triangleList => {
          return Math.max(
            ...triangleList.map(triangle => {
              return Math.max(...triangle.map(point => point.y));
            }),
          );
        }),
      );

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillStyle = 'rgba(173, 216, 230, 1.0)';

    for (const triangleList of shapes) {
      for (const triangle of triangleList) {
        ctx.beginPath();

        for (let i = 0; i < triangle.length; i++) {
          const { x, y } = triangle[i];

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();

        ctx.stroke();
        ctx.fill();
      }
    }

    await fs.ensureFile(outputPath);
    await fs.writeFile(outputPath, canvas.toBuffer('image/png'));

    this.log(`Converted triangulated shapes in ${inputPath} to image in ${outputPath}`);
  }
}
