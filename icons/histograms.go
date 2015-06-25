package main

import (
	"fmt"
	"io/ioutil"
	"math"
	"strconv"
)

func main() {
	for i := 5; i <= 25; i++ {
		generateImage(i, 0.5/float64(i), 3, 1.5, 1)
	}
}

func generateImage(numBars int, spacing, width, height, xScale float64) {
	viewBox := fmt.Sprintf("%f %f %f %f", -width/2, 0.0, width, height)
	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"" + viewBox + "\"><g fill=\"black\">"
	rectTemplate := "<rect fill=\"inherit\" x=\"%f\" y=\"%f\" " +
		"width=\"%f\" height=\"%f\" />"
	barWidth := (width - spacing*float64(numBars+1)) / float64(numBars)
	for i := 0; i < numBars; i++ {
		xVal := -width/2.0 + float64(i+1)*spacing + barWidth*float64(i)
		useXVal := (xVal + barWidth/2) * xScale
		yVal := height*math.Exp(-useXVal * useXVal)
		svgData += fmt.Sprintf(rectTemplate, xVal, height-yVal, barWidth, yVal)
	}
	svgData += "</g></svg>"
	ioutil.WriteFile("histogram"+strconv.Itoa(numBars)+".svg", []byte(svgData), 0777)
}
