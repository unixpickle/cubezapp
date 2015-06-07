package main

import (
	"fmt"
	"io/ioutil"
	"math"
)

const (
	HorizontalSpacing       = 0.05
	UpsideDownVerticalRatio = 0.33333333333333
)

func main() {
	imageHeight := math.Sqrt(3) / 2
	imageWidth := float64(1)
	triangleSide := (imageWidth - HorizontalSpacing*2) / 3
	triangleHeight := triangleSide * math.Sqrt(3) / 2
	totalVerticalSpace := imageHeight - triangleHeight*3
	verticalLift := totalVerticalSpace / 2 * (1 - UpsideDownVerticalRatio)
	upsidedownLift := totalVerticalSpace / 2 * UpsideDownVerticalRatio

	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"0 0 1 0.866025404\"><g class=\"puzzle-icon-fill\" " +
		"fill=\"white\">"

	// Generate the regular triangles.
	triangle := fmt.Sprintf("<path fill=\"inherit\" "+
		"d=\"M %%f,%%f h %f l %f,%f z\" />", triangleSide, -triangleSide/2,
		-triangleHeight)
	for i := float64(0); i < 3; i++ {
		x := i * (triangleSide + HorizontalSpacing)
		svgData += fmt.Sprintf(triangle, x, imageHeight)
	}
	for i := float64(0); i < 2; i++ {
		x := (imageWidth-HorizontalSpacing)/2 - triangleSide +
			i*(triangleSide+HorizontalSpacing)
		svgData += fmt.Sprintf(triangle, x, imageHeight-triangleHeight-
			verticalLift-upsidedownLift)
	}
	svgData += fmt.Sprintf(triangle, (imageWidth-triangleSide)/2,
		triangleHeight)

	// Generate the inverted triangles.
	invertedTriangle := fmt.Sprintf("<path fill=\"inherit\" "+
		"d=\"M %%f,%%f l %f,%f h %f z\" />", triangleSide/2, -triangleHeight,
		-triangleSide)
	svgData += fmt.Sprintf(invertedTriangle,
		(imageWidth-triangleSide)/2-HorizontalSpacing/2,
		imageHeight-upsidedownLift)
	svgData += fmt.Sprintf(invertedTriangle,
		(imageWidth+triangleSide)/2+HorizontalSpacing/2,
		imageHeight-upsidedownLift)
	svgData += fmt.Sprintf(invertedTriangle, imageWidth/2,
		imageHeight-upsidedownLift*2-triangleHeight-verticalLift)

	svgData += "</g></svg>"

	ioutil.WriteFile("pyraminx.svg", []byte(svgData), 0777)
}
