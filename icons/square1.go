package main

import (
	"fmt"
	"io/ioutil"
	"math"
)

const (
	BigTriangleInset   = 0.025
	SmallTriangleInset = 0.05
)

func main() {
	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"0 0 1 1\"><g class=\"puzzle-icon-fill\" " +
		"fill=\"white\">"

	sideOffset := math.Tan(15*math.Pi/180) * (0.5 - SmallTriangleInset)
	svgData += triangle(0.5+SmallTriangleInset, 0.5, 1, 0.5-sideOffset, 1,
		0.5+sideOffset)
	svgData += triangle(0.5-SmallTriangleInset, 0.5, 0, 0.5-sideOffset, 0,
		0.5+sideOffset)
	svgData += triangle(0.5, 0.5-SmallTriangleInset, 0.5-sideOffset, 0,
		0.5+sideOffset, 0)
	svgData += triangle(0.5, 0.5+SmallTriangleInset, 0.5-sideOffset, 1,
		0.5+sideOffset, 1)

	btVec := BigTriangleInset / math.Sqrt(2)
	bigTriangleLength := math.Sqrt(2)/2 - BigTriangleInset
	btEdge := math.Sin(30*math.Pi/180) / math.Sin(105*math.Pi/180) *
		bigTriangleLength
	svgData += quad(0.5+btVec, 0.5-btVec, 1, btEdge, 1, 0, 1-btEdge, 0)
	svgData += quad(0.5-btVec, 0.5-btVec, 0, btEdge, 0, 0, btEdge, 0)
	svgData += quad(0.5-btVec, 0.5+btVec, 0, 1-btEdge, 0, 1, btEdge, 1)
	svgData += quad(0.5+btVec, 0.5+btVec, 1-btEdge, 1, 1, 1, 1, 1-btEdge)

	svgData += "</g></svg>"
	ioutil.WriteFile("square1.svg", []byte(svgData), 0777)
}

func quad(x1, y1, x2, y2, x3, y3, x4, y4 float64) string {
	return fmt.Sprintf("<polygon points=\"%f,%f %f,%f %f,%f %f,%f\" />",
		x1, y1, x2, y2, x3, y3, x4, y4)
}

func triangle(x1, y1, x2, y2, x3, y3 float64) string {
	return fmt.Sprintf("<polygon points=\"%f,%f %f,%f %f,%f\" />",
		x1, y1, x2, y2, x3, y3)
}
