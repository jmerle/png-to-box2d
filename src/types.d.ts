interface Point {
  x: number;
  y: number;
}

interface Shape {
  mainPath: Point[] | null;
  holePaths: Point[][];
}
