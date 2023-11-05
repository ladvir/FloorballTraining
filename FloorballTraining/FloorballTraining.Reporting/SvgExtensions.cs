using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace FloorballTraining.Reporting;

public static class SvgExtensions
{
    public static void Svg(this IContainer container, SkiaSharp.Extended.Svg.SKSvg svg)
    {
        container
            .AlignCenter()
            .AlignMiddle()
            .ScaleToFit()
            .Width(svg.Picture.CullRect.Width)
            .Height(svg.Picture.CullRect.Height)
            .Canvas((canvas, _) => canvas.DrawPicture(svg.Picture));
    }
}