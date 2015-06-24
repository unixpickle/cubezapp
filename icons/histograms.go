package main

import (
	"fmt"
	"io/ioutil"
	"math"
	"strconv"
)

const (
	Width = 3
	Height = 2
)

func main() {
	for _, numBars := range []int{3, 4, 5} {
		data := generateImage(numBars)
		ioutil.WriteFile("histogram"+strconv.Itoa(numBars)+".svg", []byte(data), 0777)
	}
}

func generateImage(numBars int) string {
	viewBox := fmt.Sprintf("%f %f %f %f", -Width/2.0, 0.0, float64(Width), float64(Height))
	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"" + viewBox + "\"><g class=\"puzzle-icon-fill\" fill=\"black\">"
	rectTemplate := "<rect fill=\"inherit\" x=\"%f\" y=\"%f\" " +
		"width=\"%f\" height=\"%f\" />"
	barWidth := (Width * 0.9) / float64(numBars)
	spacing := (Width - barWidth*float64(numBars)) / float64(numBars+1)
	for i := 0; i < numBars; i++ {
		xVal := -Width/2.0 + float64(i+1)*spacing + barWidth*float64(i)
		useXVal := xVal + barWidth/2
		yVal := Height*math.Exp(-useXVal * useXVal)
		svgData += fmt.Sprintf(rectTemplate, xVal, Height-yVal, barWidth, yVal)
	}
	svgData += "</g></svg>"
	return svgData
}
