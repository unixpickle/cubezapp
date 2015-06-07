package main

import (
	"fmt"
	"io/ioutil"
)

const (
	SquareInset   = 0.01
	CornerSpacing = 0.03
)

func main() {
	svgData := "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" " +
		"\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
		"<svg xmlns=\"http://www.w3.org/2000/svg\" " +
		"xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
		"viewBox=\"0 0 1 1\">"

	svgData += fmt.Sprintf("<path class=\"puzzle-icon-fill\" fill=\"black\" "+
		"d=\"M0.5,%fL%f,0.5L0.5,%fL%f,0.5zM0,0H%fL0,%fz"+
		"M1,0h%fL1,%fzM0,1h%fL0,%fzM1,1h%fL1,%fz\" />",
		SquareInset, 1-SquareInset, 1-SquareInset, SquareInset,
		0.5-CornerSpacing, 0.5-CornerSpacing,
		CornerSpacing-0.5, 0.5-CornerSpacing,
		0.5-CornerSpacing, 0.5+CornerSpacing,
		CornerSpacing-0.5, 0.5+CornerSpacing)

	svgData += "</svg>"

	ioutil.WriteFile("skewb.svg", []byte(svgData), 0777)
}
