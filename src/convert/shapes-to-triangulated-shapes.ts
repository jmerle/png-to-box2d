// Everything in this file comes from https://github.com/anko/image-to-box2d-body/blob/master/shapesToTriangles.js

import * as fs from 'fs-extra';
import { IPointLike, SweepContext } from 'poly2tri';

function extractXY(point: IPointLike): Point {
  return {
    x: point.x,
    y: point.y,
  };
}

function shapeToTriangles(shape: Shape): any {
  if (shape.mainPath === null) {
    return [];
  }

  const ctx = new SweepContext(shape.mainPath.slice(1));

  shape.holePaths.forEach(holePath => {
    ctx.addHole(holePath.slice(1));
  });

  ctx.triangulate();

  return ctx.getTriangles().map(triangle => {
    return triangle
      .getPoints()
      .map(point => extractXY(point))
      .reverse();
  });
}

export async function shapesToTriangulatedShapes(inputPath: string): Promise<any[]> {
  const inputBuffer = await fs.readFile(inputPath);
  const inputData = JSON.parse(inputBuffer.toString());
  return inputData.shapes.map((shape: Shape) => shapeToTriangles(shape));
}
