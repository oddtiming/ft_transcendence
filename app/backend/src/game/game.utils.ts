import { Vec2 } from "./vector";

export function degToRad(angle: number): number {
  return angle * (Math.PI / 180);
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect

export function checkIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): Vec2 {
  //Check to make sure none of the lines are length of 0
  if ((p1.x === p2.x && p1.y === p2.y) || (p3.x === p4.x && p3.y === p4.y))
    return null;

  const denominator: number =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  //Check if lines are parallel
  if (denominator === 0) return null;

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator;

  //Make sure intersection occurs along segment in question
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

  //Create new point and return
  const x = p1.x + ua * (p2.x - p1.x);
  const y = p1.y + ua * (p2.y - p1.y);

  return new Vec2(x, y);
}

/*
Distance between two points:

Pq = (Xq - Xp, Yq - Yp);


*/

// export function interddsect(x1, y1, x2, y2, x3, y3, x4, y4) {

//   // Check if none of the lines are of length 0
// 	if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
// 		return false
// 	}

// 	denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

//   // Lines are parallel
// 	if (denominator === 0) {
// 		return false
// 	}

// 	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
// 	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

//   // is the intersection along the segments
// 	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
// 		return false
// 	}

//   // Return a object with the x and y coordinates of the intersection
// 	let x = x1 + ua * (x2 - x1)
// 	let y = y1 + ua * (y2 - y1)

// 	return {x, y}
// }
