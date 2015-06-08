package main

import (
	"fmt"
	"io/ioutil"
	"math"
	"strings"
)

const (
	CornerSize = 0.4
	Spacing    = 0.05
)

type Point struct {
	X float64
	Y float64
}

func distance(p1, p2 Point) float64 {
	return math.Sqrt(math.Pow(p1.X-p2.X, 2) + math.Pow(p1.Y-p2.Y, 2))
}

func fractionAcross(p1, p2 Point, frac float64) Point {
	return Point{p1.X + (p2.X-p1.X)*frac, p1.Y + (p2.Y-p1.Y)*frac}
}

func main() {
	points, width, height, center := outerPentagon()

	svgData := fmt.Sprintf("<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" "+
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">"+
		"<svg xmlns=\"http://www.w3.org/2000/svg\" "+
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" "+
		"viewBox=\"0 0 %f %f\"><g class=\"puzzle-icon-fill\" "+
		"fill=\"black\">", width, height)

	var edgeP1 [5]Point
	var edgeP2 [5]Point
	var edgeP3 [5]Point
	var edgeP4 [5]Point

	// Generate the corners.
	for i := 0; i < 5; i++ {
		point := points[i]
		lastPoint := points[(i+4)%5]
		nextPoint := points[(i+1)%5]
		p1 := fractionAcross(point, lastPoint, CornerSize)
		p2 := fractionAcross(point, nextPoint, CornerSize)
		p3 := fractionAcross(point, fractionAcross(p1, p2, 0.5), 2)
		svgData += quadrilateral(p1, point, p2, p3)
		edgeP1[i] = p3
		edgeP2[i] = p2
		edgeP3[(i+4)%5] = p1
		edgeP4[(i+4)%5] = p3
	}

	// Generate the edges.
	for i := 0; i < 5; i++ {
		p1, p2, p3, p4 := edgeP1[i], edgeP2[i], edgeP3[i], edgeP4[i]
		topDistance := distance(p2, p3)
		bottomDistance := distance(p1, p4)
		topFrac := Spacing / topDistance
		p2, p3 = fractionAcross(p2, p3, topFrac),
			fractionAcross(p3, p2, topFrac)
		bottomFrac := Spacing / bottomDistance
		p1, p4 = fractionAcross(p1, p4, bottomFrac),
			fractionAcross(p4, p1, bottomFrac)
		svgData += quadrilateral(p1, p2, p3, p4)
	}

	thickness := distance(fractionAcross(edgeP2[0], edgeP3[0], 0.5),
		fractionAcross(edgeP1[0], edgeP4[0], 0.5)) + Spacing
	innerPentagonScale := 1 - thickness/math.Cos(math.Pi/5)
	svgData += innerPentagon(innerPentagonScale, center)

	svgData += "</g></svg>"

	ioutil.WriteFile("megaminx.svg", []byte(svgData), 0777)
}

func innerPentagon(scale float64, center Point) string {
	points := make([]string, 5)
	for i := 0; i < 5; i++ {
		angle := math.Pi * (float64(i)*2/5 - 0.5)
		point := Point{math.Cos(angle)*scale + center.X,
			math.Sin(angle)*scale + center.Y}
		points = append(points, fmt.Sprintf("%f,%f", point.X, point.Y))
	}
	return "<polygon points=\"" + strings.Join(points, " ") + "\" />"
}

func outerPentagon() ([5]Point, float64, float64, Point) {
	var points [5]Point
	var minX, minY, maxX, maxY float64
	for i := 0; i < 5; i++ {
		angle := math.Pi * (float64(i)*2/5 - 0.5)
		point := Point{math.Cos(angle), math.Sin(angle)}
		points[i] = point
		if point.X < minX {
			minX = point.X
		}
		if point.X > maxX {
			maxX = point.X
		}
		if point.Y < minY {
			minY = point.Y
		}
		if point.Y > maxY {
			maxY = point.Y
		}
	}
	for i := 0; i < 5; i++ {
		points[i].X -= minX
		points[i].Y -= minY
	}
	return points, maxX - minX, maxY - minY, Point{-minX, -minY}
}

func quadrilateral(p1, p2, p3, p4 Point) string {
	template := "<polygon fill=\"inherit\" points=\"%f,%f %f,%f %f,%f " +
		"%f,%f\" />"
	return fmt.Sprintf(template, p1.X, p1.Y, p2.X, p2.Y, p3.X, p3.Y, p4.X, p4.Y)
}
