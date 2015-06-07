package main

import (
	"fmt"
	"io/ioutil"
	"strconv"
)

type ImageSetting struct {
	Size    int
	Spacing float64
	Name    string
}

func main() {
	settings := []ImageSetting{
		ImageSetting{2, 20.0 / 505.0, "2x2x2"},
		ImageSetting{3, 20.0 / 505.0, "3x3x3"},
		ImageSetting{4, 15.0 / 505.0, "4x4x4"},
		ImageSetting{5, 15.0 / 505.0, "5x5x5"},
		ImageSetting{6, 10.0 / 505.0, "6x6x6"},
		ImageSetting{7, 10.0 / 505.0, "7x7x7"},
	}
	for _, s := range settings {
		runSetting(s)
	}
}

func runSetting(s ImageSetting) {
	rectSize := (1 - (float64(s.Size-1) * s.Spacing)) / float64(s.Size)
	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"0 0 1 1\"><g class=\"puzzle-icon-fill\" fill=\"white\">"
	rectTemplate := "<rect fill=\"inherit\" x=\"%f\" y=\"%f\" " +
		"width=\"%f\" height=\"%f\" />"
	for x := 0; x < s.Size; x++ {
		for y := 0; y < s.Size; y++ {
			rectX := (rectSize + s.Spacing) * float64(x)
			rectY := (rectSize + s.Spacing) * float64(y)
			svgData += fmt.Sprintf(rectTemplate, rectX, rectY, rectSize,
				rectSize)
		}
	}
	svgData += "</g></svg>"
	fileName := strconv.Itoa(s.Size) + ".svg"
	ioutil.WriteFile(fileName, []byte(svgData), 0777)
}
