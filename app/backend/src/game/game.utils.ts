import { Vec } from "./game.types";


export function degToRad(angle: number): number {
  return angle * (Math.PI / 180);
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect



export function intersect(p1: Vec, p2:Vec, p3: Vec, p4: Vec): Vec {

	//Check to make sure none of the lines are length of 0
	if ((p1[0] === p2[0] && p1[1] == p2[1]) || (p3[0] === p4[0] && p3[1] === p4[1]))
		return null;
	
	const denominator: number = (((p4[1] - p3[1]) * (p2[0] - p1[0])) - ((p4[0] - p3[0]) * (p2[1] - p1[1])));

	//Check if lines are parallel
	if (denominator === 0)
		return null;
	
	const ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / denominator;
	const ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / denominator;
	
	//Make sure intersection occurs along segment in question
	if (ua < 0 || ua > 1 || ub < 0 || ub > 1)
		return null;
	
	//Create new point and return
	const x = p1[0] + ua * (p2[0] - p1[0]);
	const y = p1[1] + ua * (p2[1] - p1[1]);

	return [x,y];

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