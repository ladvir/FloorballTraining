using System.Globalization;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace FloorballTraining.Reporting;

/// <summary>
/// Pre-processes SVG to expand marker references into inline arrow polygons.
/// SkiaSharp.Svg does not support SVG markers, so we convert them to explicit shapes.
/// </summary>
internal static class SvgMarkerExpander
{
    public static string ExpandMarkers(string svgContent)
    {
        try
        {
            var doc = XDocument.Parse(svgContent);
            if (doc.Root == null) return svgContent;

            var ns = doc.Root.GetDefaultNamespace();

            // Collect all marker definitions keyed by id
            var markerElements = doc.Descendants(ns + "marker").ToList();
            if (markerElements.Count == 0)
                markerElements = doc.Descendants("marker").ToList();

            if (markerElements.Count == 0) return svgContent;

            var markers = new Dictionary<string, XElement>();
            foreach (var m in markerElements)
            {
                var id = m.Attribute("id")?.Value;
                if (id != null) markers[id] = m;
            }

            // Find all elements with marker-end attribute
            var allElements = doc.Descendants().ToList();
            var additions = new List<(XElement parent, XElement arrow)>();

            foreach (var elem in allElements)
            {
                var markerEnd = elem.Attribute("marker-end")?.Value;
                if (string.IsNullOrEmpty(markerEnd)) continue;

                var match = Regex.Match(markerEnd, @"url\(#(.+?)\)");
                if (!match.Success) continue;

                var markerId = match.Groups[1].Value;
                if (!markers.TryGetValue(markerId, out var marker)) continue;

                // Parse marker attributes
                var markerWidth = ParseDouble(marker.Attribute("markerWidth")?.Value, 6);
                var markerHeight = ParseDouble(marker.Attribute("markerHeight")?.Value, 6);
                var refX = ParseDouble(marker.Attribute("refX")?.Value, 0);
                var refY = ParseDouble(marker.Attribute("refY")?.Value, 5);
                var viewBox = marker.Attribute("viewBox")?.Value?.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var vbWidth = viewBox is { Length: >= 4 } ? ParseDouble(viewBox[2], 10) : 10;
                var vbHeight = viewBox is { Length: >= 4 } ? ParseDouble(viewBox[3], 10) : 10;

                // Get fill color from marker's child path
                var markerPath = marker.Descendants(ns + "path").FirstOrDefault()
                                 ?? marker.Descendants("path").FirstOrDefault();
                var fillColor = markerPath?.Attribute("fill")?.Value ?? "#000";

                // Get stroke width from the element
                var strokeWidth = ParseDouble(
                    elem.Attribute("stroke-width")?.Value ?? elem.Attribute("strokeWidth")?.Value, 1);

                // Compute endpoint and angle
                var localName = elem.Name.LocalName;
                double x2, y2, angle;

                if (localName == "line")
                {
                    var x1 = ParseDouble(elem.Attribute("x1")?.Value, 0);
                    var y1 = ParseDouble(elem.Attribute("y1")?.Value, 0);
                    x2 = ParseDouble(elem.Attribute("x2")?.Value, 0);
                    y2 = ParseDouble(elem.Attribute("y2")?.Value, 0);
                    angle = Math.Atan2(y2 - y1, x2 - x1);
                }
                else if (localName == "path")
                {
                    var d = elem.Attribute("d")?.Value;
                    if (string.IsNullOrEmpty(d)) continue;
                    var endInfo = GetPathEndpoint(d);
                    if (endInfo == null) continue;
                    x2 = endInfo.Value.x;
                    y2 = endInfo.Value.y;
                    angle = endInfo.Value.angle;
                }
                else if (localName == "polyline")
                {
                    var points = elem.Attribute("points")?.Value;
                    if (string.IsNullOrEmpty(points)) continue;
                    var endInfo = GetPolylineEndpoint(points);
                    if (endInfo == null) continue;
                    x2 = endInfo.Value.x;
                    y2 = endInfo.Value.y;
                    angle = endInfo.Value.angle;
                }
                else
                {
                    continue;
                }

                // Scale factors: markerUnits=strokeWidth means scale by strokeWidth
                var scaleX = strokeWidth * markerWidth / vbWidth;
                var scaleY = strokeWidth * markerHeight / vbHeight;

                // Arrow triangle in marker coords: (0,0), (vbWidth, vbHeight/2), (0, vbHeight)
                // The marker shape is "M 0 0 L 10 5 L 0 10 z"
                var pts = new[]
                {
                    (mx: 0.0, my: 0.0),
                    (mx: vbWidth, my: vbHeight / 2),
                    (mx: 0.0, my: vbHeight)
                };

                // Transform each point: subtract ref, scale, rotate, translate to endpoint
                var cos = Math.Cos(angle);
                var sin = Math.Sin(angle);
                var transformed = new (double x, double y)[3];
                for (int i = 0; i < 3; i++)
                {
                    var px = (pts[i].mx - refX) * scaleX;
                    var py = (pts[i].my - refY) * scaleY;
                    transformed[i] = (
                        x2 + px * cos - py * sin,
                        y2 + px * sin + py * cos
                    );
                }

                var pointsStr = string.Join(" ",
                    transformed.Select(p =>
                        $"{p.x.ToString("F2", CultureInfo.InvariantCulture)},{p.y.ToString("F2", CultureInfo.InvariantCulture)}"));

                var polygon = new XElement(ns + "polygon",
                    new XAttribute("points", pointsStr),
                    new XAttribute("fill", fillColor));

                // Remove marker-end from the element
                elem.Attribute("marker-end")?.Remove();

                // Add arrow polygon to the same parent
                var parent = elem.Parent;
                if (parent != null)
                    additions.Add((parent, polygon));
            }

            // Add all arrow polygons
            foreach (var (parent, arrow) in additions)
            {
                parent.Add(arrow);
            }

            // Remove marker definitions (no longer needed)
            foreach (var m in markerElements)
            {
                m.Remove();
            }

            // Clean up empty <defs> elements
            var emptyDefs = doc.Descendants(ns + "defs")
                .Concat(doc.Descendants("defs"))
                .Where(d => !d.HasElements)
                .ToList();
            foreach (var d in emptyDefs) d.Remove();

            return doc.Declaration != null
                ? doc.Declaration + Environment.NewLine + doc.Root
                : doc.ToString();
        }
        catch
        {
            return svgContent;
        }
    }

    private static (double x, double y, double angle)? GetPathEndpoint(string d)
    {
        // Extract all coordinate pairs from path commands
        // We support M, L, Q, C, S, T commands (absolute)
        // and m, l, q, c, s, t (relative)
        var numbers = Regex.Matches(d, @"-?\d+\.?\d*");
        if (numbers.Count < 4) return null;

        double cx = 0, cy = 0;
        double prevX = 0, prevY = 0;

        var tokens = Regex.Matches(d, @"[MmLlHhVvCcSsQqTtAaZz]|-?\d+\.?\d*(?:[eE][+-]?\d+)?");

        char currentCmd = 'M';
        var coordBuf = new List<double>();

        foreach (Match token in tokens)
        {
            var val = token.Value;
            if (val.Length == 1 && char.IsLetter(val[0]))
            {
                // Process previous command
                ProcessCommand(currentCmd, coordBuf, ref cx, ref cy, ref prevX, ref prevY);
                currentCmd = val[0];
                coordBuf.Clear();
            }
            else
            {
                coordBuf.Add(ParseDouble(val, 0));
            }
        }
        // Process last command
        ProcessCommand(currentCmd, coordBuf, ref cx, ref cy, ref prevX, ref prevY);

        var angle = Math.Atan2(cy - prevY, cx - prevX);
        return (cx, cy, angle);
    }

    private static void ProcessCommand(char cmd, List<double> coords, ref double cx, ref double cy,
        ref double prevX, ref double prevY)
    {
        if (coords.Count == 0 && cmd != 'Z' && cmd != 'z') return;

        switch (cmd)
        {
            case 'M':
                for (int i = 0; i + 1 < coords.Count; i += 2)
                {
                    prevX = cx; prevY = cy;
                    cx = coords[i]; cy = coords[i + 1];
                }
                break;
            case 'm':
                for (int i = 0; i + 1 < coords.Count; i += 2)
                {
                    prevX = cx; prevY = cy;
                    cx += coords[i]; cy += coords[i + 1];
                }
                break;
            case 'L':
                for (int i = 0; i + 1 < coords.Count; i += 2)
                {
                    prevX = cx; prevY = cy;
                    cx = coords[i]; cy = coords[i + 1];
                }
                break;
            case 'l':
                for (int i = 0; i + 1 < coords.Count; i += 2)
                {
                    prevX = cx; prevY = cy;
                    cx += coords[i]; cy += coords[i + 1];
                }
                break;
            case 'H':
                prevX = cx; prevY = cy;
                cx = coords.Last();
                break;
            case 'h':
                prevX = cx; prevY = cy;
                cx += coords.Last();
                break;
            case 'V':
                prevX = cx; prevY = cy;
                cy = coords.Last();
                break;
            case 'v':
                prevX = cx; prevY = cy;
                cy += coords.Last();
                break;
            case 'C': // cubic bezier: c1x c1y c2x c2y x y
                for (int i = 0; i + 5 < coords.Count; i += 6)
                {
                    prevX = coords[i + 2]; prevY = coords[i + 3]; // second control point
                    cx = coords[i + 4]; cy = coords[i + 5];
                }
                break;
            case 'c':
                for (int i = 0; i + 5 < coords.Count; i += 6)
                {
                    prevX = cx + coords[i + 2]; prevY = cy + coords[i + 3];
                    cx += coords[i + 4]; cy += coords[i + 5];
                }
                break;
            case 'S': // smooth cubic: c2x c2y x y
                for (int i = 0; i + 3 < coords.Count; i += 4)
                {
                    prevX = coords[i]; prevY = coords[i + 1];
                    cx = coords[i + 2]; cy = coords[i + 3];
                }
                break;
            case 's':
                for (int i = 0; i + 3 < coords.Count; i += 4)
                {
                    prevX = cx + coords[i]; prevY = cy + coords[i + 1];
                    cx += coords[i + 2]; cy += coords[i + 3];
                }
                break;
            case 'Q': // quadratic: cx cy x y
                for (int i = 0; i + 3 < coords.Count; i += 4)
                {
                    prevX = coords[i]; prevY = coords[i + 1];
                    cx = coords[i + 2]; cy = coords[i + 3];
                }
                break;
            case 'q':
                for (int i = 0; i + 3 < coords.Count; i += 4)
                {
                    prevX = cx + coords[i]; prevY = cy + coords[i + 1];
                    cx += coords[i + 2]; cy += coords[i + 3];
                }
                break;
            case 'T': // smooth quadratic: x y
                for (int i = 0; i + 1 < coords.Count; i += 2)
                {
                    prevX = cx; prevY = cy;
                    cx = coords[i]; cy = coords[i + 1];
                }
                break;
            case 't':
                for (int i = 0; i + 1 < coords.Count; i += 2)
                {
                    prevX = cx; prevY = cy;
                    cx += coords[i]; cy += coords[i + 1];
                }
                break;
        }
    }

    private static (double x, double y, double angle)? GetPolylineEndpoint(string pointsAttr)
    {
        var nums = Regex.Matches(pointsAttr, @"-?\d+\.?\d*")
            .Select(m => ParseDouble(m.Value, 0)).ToList();
        if (nums.Count < 4) return null;

        var x1 = nums[^4]; var y1 = nums[^3];
        var x2 = nums[^2]; var y2 = nums[^1];
        return (x2, y2, Math.Atan2(y2 - y1, x2 - x1));
    }

    private static double ParseDouble(string? s, double fallback)
    {
        if (string.IsNullOrEmpty(s)) return fallback;
        return double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }
}
