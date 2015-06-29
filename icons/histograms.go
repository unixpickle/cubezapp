package main

import (
	"fmt"
	"io/ioutil"
	"math"
	"strconv"
)

const (
	Width         = 40
	Height        = 15
	OutwardRadius = 2
)

type Config struct {
	Count    int
	BarWidth int
	Spacing  int
}

func (c Config) Width() int {
	return c.Count*c.BarWidth + (c.Count-1)*c.Spacing
}

func main() {
	for i := 5; i <= 11; i++ {
		spacing := math.Ceil(10.0 / float64(i))
		barWidth := math.Floor((Width - spacing*float64(i+1)) / float64(i))
		generateImage(Config{i, int(barWidth), int(spacing)})
	}
}

func generateImage(c Config) {
	xOffset := (Width - c.Width()) / 2
	viewBox := fmt.Sprintf("0 0 %d %d", 40, Height)
	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"" + viewBox + "\" ><g fill=\"#777\">"
	rectTemplate := "<rect fill=\"inherit\" x=\"%d\" y=\"%d\" " +
		"width=\"%d\" height=\"%d\" />"
	xSpacing := OutwardRadius * 2.0 / float64(c.Count+1)
	for i := 0; i < c.Count; i++ {
		xVal := -OutwardRadius + float64(i+1)*xSpacing
		height := math.Floor(Height * math.Exp(-xVal*xVal/2))
		barXVal := xOffset + (c.Spacing+c.BarWidth)*i
		svgData += fmt.Sprintf(rectTemplate, int(barXVal), int(Height-height), int(c.BarWidth),
			int(height))
	}
	svgData += "</g></svg>"
	ioutil.WriteFile("histogram"+strconv.Itoa(c.Count)+".svg", []byte(svgData), 0777)
}
