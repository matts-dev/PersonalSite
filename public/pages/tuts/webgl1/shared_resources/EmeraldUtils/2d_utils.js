
/**
 * From http://www.ambrsoft.com/TrigoCalc/Circles2/circle2intersection/CircleCircleIntersection.htm
 * Which I found from https://math.stackexchange.com/questions/256100/how-can-i-find-the-points-at-which-two-circles-intersect
 * modified slightly for my purposes.
 * 
 * From site:
 *      example: if circle center is at the point (-2 , 3) then the circle equation is:    (x + 2)2 + (y – 3)2 = 0
 *      ∂ is the area of the triangle formed by the two circle centers and one of the intersection point. The sides of this triangle are S, r0 and r1 , the area is calculated by Heron' s formula.
 * 
 * my notes:
 *      a = x coordinate of 2d circle
 *      b = y coordinate of 2d circle
 * 
 *      It doesn't appear to account for when there is a singlular intersection point.
 */
export class Circle_ambrsoft { constructor(a, b, r) { this.a = a; this.b = b; this.r = r; }}
export function twoCirclesIntersection_ambrsoft(c1, c2)
{
    //**************************************************************
    //Calculating intersection coordinates (x1, y1) and (x2, y2) of
    //two circles of the form (x - c1.a)^2 + (y - c1.b)^2 = c1.r^2
    //                        (x - c2.a)^2 + (y - c2.b)^2 = c2.r^2
    //
    // Return value:   obj if the two circles intersects
    //                 null if the two circles do not intersects
    //**************************************************************
    var val1, val2, test;
    // Calculating distance between circles centers
    var D = Math.sqrt((c1.a - c2.a) * (c1.a - c2.a) + (c1.b - c2.b) * (c1.b - c2.b));
    if (((c1.r + c2.r) >= D) && (D >= Math.abs(c1.r - c2.r)))
    {
        // Two circles intersects or tangent
        // Area according to Heron's formula
        //----------------------------------
        var a1 = D + c1.r + c2.r;
        var a2 = D + c1.r - c2.r;
        var a3 = D - c1.r + c2.r;
        var a4 = -D + c1.r + c2.r;
        var area = Math.sqrt(a1 * a2 * a3 * a4) / 4;
        // Calculating x axis intersection values
        //---------------------------------------
        val1 = (c1.a + c2.a) / 2 + (c2.a - c1.a) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
        val2 = 2 * (c1.b - c2.b) * area / (D * D);
        let x1 = val1 + val2;
        let x2 = val1 - val2;
        // Calculating y axis intersection values
        //---------------------------------------
        val1 = (c1.b + c2.b) / 2 + (c2.b - c1.b) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
        val2 = 2 * (c1.a - c2.a) * area / (D * D);
        let y1 = val1 - val2;
        let y2 = val1 + val2;
        // Intersection pointsare (x1, y1) and (x2, y2)
        // Because for every x we have two values of y, and the same thing for y,
        // we have to verify that the intersection points as chose are on the
        // circle otherwise we have to swap between the points
        test = Math.abs((x1 - c1.a) * (x1 - c1.a) + (y1 - c1.b) * (y1 - c1.b) - c1.r * c1.r);
        if (test > 0.0000001) 
        {
            // point is not on the circle, swap between y1 and y2
            // the value of 0.0000001 is arbitrary chose, smaller values are also OK
            // do not use the value 0 because of computer rounding problems
            var tmp = y1;
            y1 = y2;
            y2 = tmp;
        }
        return {first: [x1, y1], second:[x2, y2]};
    }
    else
    {
        // circles are not intersecting each other
        return null;
    }
}