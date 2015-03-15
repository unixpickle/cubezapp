package main

import (
	"github.com/unixpickle/gogui"
	"math"
	"fmt"
)

const Size = 400
var _ = fmt.Println

func drawMinx(ctx gogui.DrawContext) {
	ctx.SetFill(gogui.Color{0x2b / 255.0, 0x14 / 255.0, 5 / 255.0, 1})
	ctx.FillRect(gogui.Rect{0, 0, Size, Size})
	
	// Figure out the inner and outer pentagon size
	innerRadius := Size / 6.0
	outerRadius := innerRadius * 2.5
	
	// Trace inner pentagon
	ctx.SetStroke(gogui.Color{1, 1, 1, 1})
	ctx.BeginPath()
	for i := 0; i < 5; i++ {
		angle := float64(i) * math.Pi / 2.5
		fmt.Println(angle)
		x := math.Cos(angle)*innerRadius + Size/2
		y := math.Sin(angle)*innerRadius + Size/2
		if i == 0 {
			ctx.MoveTo(x, y)
		} else {
			ctx.LineTo(x, y)
		}
	}
	ctx.ClosePath()
	ctx.StrokePath()
	
	// Trace inner pentagon
	ctx.SetStroke(gogui.Color{1, 1, 0, 1})
	ctx.BeginPath()
	for i := 0; i < 5; i++ {
		angle := float64(i) * math.Pi / 2.5
		fmt.Println(angle)
		x := math.Cos(angle)*outerRadius + Size/2
		y := math.Sin(angle)*outerRadius + Size/2
		if i == 0 {
			ctx.MoveTo(x, y)
		} else {
			ctx.LineTo(x, y)
		}
	}
	ctx.ClosePath()
	ctx.StrokePath()
}

func main() {
	gogui.RunOnMain(makeWindow)
	gogui.Main(&gogui.AppInfo{Name: "Megaminx"})
}

func makeWindow() {
	w, _ := gogui.NewWindow(gogui.Rect{0, 0, Size, Size})
	c, _ := gogui.NewCanvas(gogui.Rect{0, 0, Size, Size})
	c.SetDrawHandler(drawMinx)
	w.Add(c)
	w.SetTitle("Megaminx")
	w.Center()
	w.Show()
	
	c.NeedsUpdate()
}
