package main

import (
	"bufio"
	"code.google.com/p/draw2d/draw2d"
	"image"
	"image/png"
	"math"
	"os"
)

type ImageSetting struct {
	Size        int
	InnerRadius float64
	OuterRadius float64
	Spacing     float64
	Name        string
}

func main() {
	settings := []ImageSetting{
		ImageSetting{2, 0, 0, 20.0/505.0, "2x2x2"},
		ImageSetting{3, 0, 0, 20.0/505.0, "3x3x3"},
		ImageSetting{4, 0, 0, 15.0/505.0, "4x4x4"},
		ImageSetting{5, 0, 0, 15.0/505.0, "5x5x5"},
		ImageSetting{6, 0, 0, 10.0/505.0, "6x6x6"},
		ImageSetting{7, 0, 0, 10.0/505.0, "7x7x7"},
	}
	for _, s := range settings {
		runSetting(s)
	}
}

func runSetting(s ImageSetting) {
	dim := 505
	i := image.NewRGBA(image.Rect(0, 0, dim, dim))
	ctx := draw2d.NewGraphicContext(i)
	
	ctx.SetStrokeColor(image.White)
	ctx.SetFillColor(image.White)
	
	spacing := s.Spacing * float64(dim)
	size := s.Size
	innerRadius := s.InnerRadius * float64(dim)
	outerRadius := s.OuterRadius * float64(dim)
	
	blockSize := (float64(dim)-spacing*float64(size-1)) / float64(size)
	for i := 0; i < size; i++ {
		for j := 0; j < size; j++ {
			x := float64(i) * (blockSize+spacing)
			y := float64(j) * (blockSize+spacing)
			
			rad1 := innerRadius
			rad2 := innerRadius
			rad3 := innerRadius
			rad4 := innerRadius
			
			if i == 0 {
				rad1 = outerRadius
				rad4 = outerRadius
			} else if i == size-1 {
				rad2 = outerRadius
				rad3 = outerRadius
			}
			
			if j == 0 {
				rad1 = outerRadius
				rad2 = outerRadius
			} else if j == size-1 {
				rad3 = outerRadius
				rad4 = outerRadius
			}
			
			ctx.BeginPath()
			ctx.MoveTo(x, y+rad1)
			ctx.ArcTo(x+rad1, y+rad1, rad1, rad1, math.Pi, math.Pi/2)
			ctx.LineTo(x+blockSize-rad2, y)
			ctx.ArcTo(x+blockSize-rad2, y+rad2, rad2, rad2, 3.0*math.Pi/2, 
				math.Pi/2.0)
			ctx.LineTo(x+blockSize, y+blockSize-rad3)
			ctx.ArcTo(x+blockSize-rad3, y+blockSize-rad3, rad3, rad3, 0,
				math.Pi/2)
			ctx.LineTo(x+rad4, y+blockSize)
			ctx.ArcTo(x+rad4, y+blockSize-rad4, rad4, rad4, math.Pi/2,
				math.Pi/2)
			ctx.Close()
			ctx.Fill()
		}
	}
	
	f, _ := os.Create(s.Name + ".png")
	b := bufio.NewWriter(f)
	png.Encode(b, i)
	b.Flush()
	f.Close()
}
