using System.Text;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using SkiaSharp;

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
            .SkiaSharpCanvas((canvas, _) => canvas.DrawPicture(svg.Picture));
    }



    public static void SkiaSharpCanvas(this IContainer container, Action<SKCanvas, Size> drawOnCanvas)
    {
        container.Svg(size =>
        {
            using var stream = new MemoryStream();

            using (var canvas = SKSvgCanvas.Create(new SKRect(0, 0, size.Width, size.Height), stream))
                drawOnCanvas(canvas, size);

            var svgData = stream.ToArray();
            return Encoding.UTF8.GetString(svgData);
        });
    }

    public static void SkiaSharpRasterized(this IContainer container, Action<SKCanvas, Size> drawOnCanvas)
    {
        container.Image(payload =>
        {
            using var bitmap = new SKBitmap(payload.ImageSize.Width, payload.ImageSize.Height);

            using (var canvas = new SKCanvas(bitmap))
            {
                var scalingFactor = payload.Dpi / (float)DocumentSettings.DefaultRasterDpi;
                canvas.Scale(scalingFactor);
                drawOnCanvas(canvas, payload.AvailableSpace);
            }

            return bitmap.Encode(SKEncodedImageFormat.Png, 100).ToArray();
        });
    }

}