// Everything in this file comes from https://github.com/anko/image-to-box2d-body/blob/master/shapesToTriangles.js

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

export async function shapesToTriangulatedShapes(shapes: Shape[]): Promise<any[]> {
  const triangles: any[] = [];

  for (const shape of shapes) {
    try {
      triangles.push(shapeToTriangles(shape));
    } catch (err) {
      // Ignore the shape if it causes an error with poly2tri
    }
  }

  return triangles;
}
