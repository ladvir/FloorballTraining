using System.Globalization;
using SkiaSharp;

namespace FloorballTraining.API.Services;

/// <summary>
/// Rasterizes one video-editor annotation (line or freehand stroke) into a transparent PNG at the
/// source video's native resolution, so ffmpeg can overlay it for its visible time window (#141).
/// Mirrors the web editor's rendering — same Chaikin smoothing for freehand strokes as
/// DrawingUtils.ts/pointsToSmoothPath, same stroke/color/dash handling as AnnotationOverlay.tsx —
/// so a burned-in export looks the same as what the coach drew.
/// </summary>
public static class VideoAnnotationRenderer
{
    public static byte[] RenderLine(
        int width, int height, double x1, double y1, double x2, double y2, string color, double strokeWidth, string? dash)
    {
        using var bitmap = CreateTransparentBitmap(width, height);
        using var canvas = new SKCanvas(bitmap);
        using var paint = BuildPaint(color, strokeWidth, dash);
        canvas.DrawLine((float)x1, (float)y1, (float)x2, (float)y2, paint);
        return Encode(bitmap);
    }

    public static byte[] RenderFreehand(
        int width, int height, IReadOnlyList<(double X, double Y)> points, string color, double strokeWidth, string? dash)
    {
        using var bitmap = CreateTransparentBitmap(width, height);
        using var canvas = new SKCanvas(bitmap);
        using var paint = BuildPaint(color, strokeWidth, dash);
        using var path = BuildSmoothPath(points);
        canvas.DrawPath(path, paint);
        return Encode(bitmap);
    }

    private static SKBitmap CreateTransparentBitmap(int width, int height)
    {
        var bitmap = new SKBitmap(new SKImageInfo(width, height, SKColorType.Bgra8888, SKAlphaType.Premul));
        bitmap.Erase(SKColors.Transparent);
        return bitmap;
    }

    private static SKPaint BuildPaint(string color, double strokeWidth, string? dash)
    {
        var paint = new SKPaint
        {
            Color = SKColor.Parse(color),
            StrokeWidth = (float)strokeWidth,
            Style = SKPaintStyle.Stroke,
            StrokeCap = SKStrokeCap.Round,
            IsAntialias = true,
        };
        var intervals = ParseDash(dash);
        if (intervals != null)
            paint.PathEffect = SKPathEffect.CreateDash(intervals, 0);
        return paint;
    }

    private static float[]? ParseDash(string? dash)
    {
        if (string.IsNullOrWhiteSpace(dash)) return null;
        var parts = dash.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        // SKPathEffect.CreateDash requires an even-length on/off interval array.
        if (parts.Length < 2 || parts.Length % 2 != 0) return null;
        return parts.Select(p => float.Parse(p, CultureInfo.InvariantCulture)).ToArray();
    }

    // Same algorithm as DrawingUtils.ts chaikinSmoothAggressive.
    private static SKPath BuildSmoothPath(IReadOnlyList<(double X, double Y)> points, int iterations = 5, int downsampleStep = 2)
    {
        var pts = points.Where((_, i) => i % downsampleStep == 0).ToList();
        if (pts.Count < 2) pts = points.ToList();

        for (var iter = 0; iter < iterations; iter++)
        {
            if (pts.Count < 2) break;
            var next = new List<(double X, double Y)> { pts[0] };
            for (var i = 0; i < pts.Count - 1; i++)
            {
                var p0 = pts[i];
                var p1 = pts[i + 1];
                next.Add((0.75 * p0.X + 0.25 * p1.X, 0.75 * p0.Y + 0.25 * p1.Y));
                next.Add((0.25 * p0.X + 0.75 * p1.X, 0.25 * p0.Y + 0.75 * p1.Y));
            }
            next.Add(pts[^1]);
            pts = next;
        }

        var path = new SKPath();
        if (pts.Count < 2) return path;
        path.MoveTo((float)pts[0].X, (float)pts[0].Y);
        for (var i = 1; i < pts.Count; i++) path.LineTo((float)pts[i].X, (float)pts[i].Y);
        return path;
    }

    private static byte[] Encode(SKBitmap bitmap)
    {
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }
}
