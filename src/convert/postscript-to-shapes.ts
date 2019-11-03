// Most of the logic in this file comes from https://github.com/anko/image-to-box2d-body/blob/master/convertToShapes.js

import * as fs from 'fs-extra';

// tslint:disable-next-line:no-var-requires
const simplify = require('simplify-js');

let shapes: Shape[];

let currentShape: Shape;
let currentPath: Point[];
let currentAbsolutePosition: Point;
let scale: Point;
let height: number;
let simplifyTolerance: number;

function createShape(): Shape {
  return {
    mainPath: null,
    holePaths: [],
  };
}

function reset(tolerance: number): void {
  shapes = [];

  currentShape = createShape();
  currentPath = [];
  currentAbsolutePosition = { x: 0, y: 0 };
  scale = { x: 1.0, y: 1.0 };
  height = 0;

  simplifyTolerance = tolerance;
}

function addPointToCurrentPath(x: number, y: number): void {
  currentPath.push({
    x: Math.floor(x),
    y: Math.floor(height - y),
  });
}

function endCurrentPath(): void {
  currentPath = simplify(currentPath, simplifyTolerance);

  if (currentShape.mainPath === null) {
    currentShape.mainPath = currentPath;
  } else {
    currentShape.holePaths.push(currentPath);
  }

  currentPath = [];
}

function endCurrentShape(): void {
  shapes.push(currentShape);
  currentShape = createShape();
}

function processLine(line: string): void {
  const matches = line.match(/^(-?[0-9.]+)\s+(-?[0-9.]+)\s+(moveto|rlineto|scale)$/);

  if (matches !== null) {
    const x = parseFloat(matches[1]) * scale.x;
    const y = parseFloat(matches[2]) * scale.y;
    const method = matches[3];

    switch (method) {
      case 'moveto':
        currentAbsolutePosition.x = x;
        currentAbsolutePosition.y = y;
        break;
      case 'rlineto':
        currentAbsolutePosition.x += x;
        currentAbsolutePosition.y += y;
        addPointToCurrentPath(currentAbsolutePosition.x, currentAbsolutePosition.y);
        break;
      case 'scale':
        scale.x = x;
        scale.y = y;
        break;
    }
  } else if (line === 'closepath') {
    endCurrentPath();
  } else if (line === 'fill') {
    endCurrentShape();
  } else if (line.startsWith('%%BoundingBox')) {
    const boundingBoxMatches = line.match(/([\d]+)/g);
    height = parseInt(boundingBoxMatches[3], 10);
  }
}

export async function postScriptToShapes(inputPath: string, outputPath: string, tolerance: number): Promise<Shape[]> {
  reset(tolerance);

  const inputBuffer = await fs.readFile(inputPath);
  const inputLines = inputBuffer
    .toString()
    .trim()
    .split('\n');

  for (const line of inputLines) {
    processLine(line);
  }

  return shapes;
}
