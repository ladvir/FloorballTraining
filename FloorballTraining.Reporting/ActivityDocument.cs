using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Extensions;
using FloorballTraining.Services;
using QRCoder;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SkiaSharp;

namespace FloorballTraining.Reporting;

public class ActivityDocument : IDocument
{
    private readonly IFileHandlingService _fileHandlingService;
    private readonly AppSettings _appSettings;
    private readonly string _requestedFrom;
    private readonly PdfOptions _options;

    public ActivityDto Model { get; }

    public ActivityDocument(ActivityDto model, IFileHandlingService fileHandlingService, AppSettings appSettings, string requestedFrom, PdfOptions? options = null)
    {

        Model = model;
        _fileHandlingService = fileHandlingService;
        _appSettings = appSettings;
        _requestedFrom = requestedFrom;
        _options = options ?? new PdfOptions();

        Settings.License = LicenseType.Community;

        Settings.CheckIfAllTextGlyphsAreAvailable = false;
    }

    public DocumentMetadata GetMetadata() => new()
    {
        CreationDate = DateTime.Now,
        Title = Model.Name,
        Producer = "www.flotr.cz",
        Creator = "www.flotr.cz"

    };

    public DocumentSettings GetSettings() => new()
    {
        ImageCompressionQuality = ImageCompressionQuality.Medium
    };

    public void Compose(IDocumentContainer container)
    {
        container
            .Page(page =>
            {
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).FontFamily(Fonts.Calibri).FontFamily(Fonts.Verdana));
                page.Margin(8, Unit.Millimetre);

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);

                page.Footer().Element(ComposeFooter);
            });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Row(row =>
            {
                row.RelativeItem().AlignLeft().ExtendHorizontal().Text(GetMetadata().Producer);

                row.RelativeItem().ContentFromRightToLeft().AlignRight().ExtendHorizontal().Text(x =>
                {
                    x.TotalPages();
                    x.Span(" / ");
                    x.CurrentPageNumber();
                });
            }
        );
    }

    void ComposeHeader(IContainer container)
    {
        container
            .Shrink()
            .PaddingBottom(10)
            .Row(row =>
            {
                row.RelativeItem()
                    .AlignLeft()
                    .AlignMiddle()
                    .ExtendHorizontal()
                    .Text(Model.Name)
                    .FontSize(16)
                    .Bold()
                    .FontColor(Colors.Blue.Medium);

                if (!string.IsNullOrEmpty(_requestedFrom))
                    row.RelativeItem().ContentFromRightToLeft().AlignRight().AlignMiddle().ExtendHorizontal().Width(24).Image(GenerateQRCode(_requestedFrom));
            });
    }

    void ComposeContent(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.Spacing(4);
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Věk. kategorie", string.Join(", ", Model.ActivityAgeGroups.Select(ag => ag.AgeGroup!.Name).OrderBy(ag => ag)), "group.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Doba trvání", StringExtensions.GetRangeString(Model.DurationMin, Model.DurationMax), "sandglass.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Počet osob", StringExtensions.GetRangeString(Model.PersonsMin, Model.PersonsMax, "", Model.GoaliesMin, Model.GoaliesMax, " G", "-"), "peoplecom.svg"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Intenzita", Intensities.Descriptions[Model.Intensity], "thermostat.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Obtížnost", Difficulties.Descriptions[Model.Difficulty], "pulse.svg"));
            });

            column.Item().PaddingVertical(4).Row(row =>
            {

                row.Spacing(4);
                row.RelativeItem().Element((e) => RoundedInfoBox(e, "Štítky", string.Join(", ", Model.ActivityTags.Select(ag => ag.Tag!.Name).OrderBy(ag => ag)), "tags.png", HorizontalAlignment.Left));
                row.RelativeItem().Element((e) => RoundedInfoBox(e, "Vybavení", string.Join(", ", Model.ActivityEquipments.Select(ae => ae.Equipment!.Name).OrderBy(o => o)), "equipment.png", HorizontalAlignment.Left));
            });

            //Description
            if (_options.IncludeActivityDescriptions)
            {
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.RelativeItem().Element((e) =>
                    {
                        if (Model.Description != null)
                            RoundedInfoBox(e, "Popis", Model.Description, "task.png", HorizontalAlignment.Left);
                    });
                });
            }

            //Images
            if (_options.IncludeImages)
            {
                column.Item().PaddingVertical(4).Row(row =>
                {

                    row.AutoItem().Column(c =>
                    {
                        foreach (var imageMedia in Model.ActivityMedium.Where(m => m.MediaType == MediaType.Image).ToList())
                        {
                            c.Item().Element((e) => AddImage(e, imageMedia));
                        }
                    });

                });
            }
        });

    }

    private void RoundedInfoBox(IContainer container, string label, string value, string imagePath, HorizontalAlignment alignment = HorizontalAlignment.Center)
    {
        container
            .Layers(layers =>
            {
                layers.Layer().SkiaSharpCanvas((canvas, size) =>
                {
                    DrawRoundedRectangle(canvas, size, Colors.White, false);
                    DrawRoundedRectangle(canvas, size, Colors.Grey.Medium, true);
                });

                layers
                    .PrimaryLayer()
                    .PaddingVertical(5)
                    .PaddingHorizontal(5)
                    .Element((x) =>
                        x.Column(column =>
                        {
                            column.Item().Shrink().ScaleToFit().Row(row =>
                            {
                                row.Spacing(4);

                                SetIcon(imagePath, row);

                                row.RelativeItem().Shrink().AlignMiddle().PaddingTop(2).Text(text =>
                                {
                                    text.AlignLeft();
                                    text.Span(label)
                                        .Bold();
                                });
                            });

                            column.Item().PaddingTop(3).Text(text =>
                            {
                                switch (alignment)
                                {
                                    case HorizontalAlignment.Center:
                                        text.AlignCenter();
                                        break;
                                    case HorizontalAlignment.Right:
                                        text.AlignRight();
                                        break;
                                    default:
                                        text.AlignLeft();
                                        break;
                                }

                                text.Span(value);
                            });
                        })
                    );
            });
    }

    private void SetIcon(string imagePath, RowDescriptor row)
    {
        if (imagePath.EndsWith("svg"))
        {
            TryLoadSvgNoException(imagePath, row);
            return;
        }

        row.ConstantItem(16).Shrink().Width(16).Image(_appSettings.AssetsPath + imagePath);

    }

    private void TryLoadSvgNoException(string imagePath, RowDescriptor row)
    {
        try
        {
            var svg = new SkiaSharp.Extended.Svg.SKSvg(new SKSize(16, 16));

            svg.Load(_appSettings.AssetsPath + imagePath);

            row.ConstantItem(16).Shrink().Svg(svg);
        }
        catch
        {
            // ignored
        }
    }

    void DrawRoundedRectangle(SKCanvas canvas, Size size, string color, bool isStroke)
    {
        using var paint = new SKPaint();
        paint.Color = SKColor.Parse(color);
        paint.IsStroke = isStroke;
        paint.StrokeWidth = 1;
        paint.IsAntialias = true;
        canvas.DrawRoundRect(0, 0, size.Width, size.Height, 5, 5, paint);
    }

    //private void AddUrls(IContainer container)
    //{
    //    var urls = Model.ActivityMedium.Where(m => m.MediaType == MediaType.URL).ToList();

    //    if (!urls.Any()) return;

    //    foreach (var urlMedia in urls)
    //    {
    //        container
    //            .PaddingTop(4)

    //            .Row(row =>  {
    //                row.Spacing(4);


    //                row.ConstantItem(24).AlignMiddle().Shrink().Width(24).Image(GenerateQRCode(urlMedia.Path));

    //                row.RelativeItem().AlignMiddle().Shrink().AlignMiddle().PaddingTop(2).Hyperlink(urlMedia.Path).Text(urlMedia.Path);

    //            });
    //    }
    //}

    private byte[] GenerateQRCode(string path)
    {
        var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(path, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }

    private void AddImage(IContainer container, ActivityMediaDto imageMedia)
    {
        container.Row(row =>
        {
            byte[]? rawBytes = null;

            if (!string.IsNullOrEmpty(imageMedia.Path))
            {
                var path = _fileHandlingService.GetActivityFolder2(Model.Name);
                var fi = new FileInfo(imageMedia.Path);
                var imgFullPath = Path.Combine(path, fi.Name);
                if (File.Exists(imgFullPath))
                    rawBytes = File.ReadAllBytes(imgFullPath);
            }

            // Try SVG content first (drawings store SVG XML in Preview)
            if (rawBytes == null && IsSvgContent(imageMedia.Preview))
            {
                rawBytes = RasterizeSvgString(imageMedia.Preview);
            }

            if (rawBytes == null && !string.IsNullOrEmpty(imageMedia.Preview))
            {
                rawBytes = ConvertToByteArray(imageMedia.Preview);
            }

            if (rawBytes == null && IsSvgContent(imageMedia.Data))
            {
                rawBytes = RasterizeSvgString(imageMedia.Data);
            }

            if (rawBytes == null && !string.IsNullOrEmpty(imageMedia.Data))
            {
                rawBytes = ConvertToByteArray(imageMedia.Data);
            }

            var pdfBytes = RasterizeForPdf(rawBytes);
            if (pdfBytes != null)
                row.AutoItem().Width(16, Unit.Centimetre).Image(pdfBytes).FitWidth();
        });
    }

    private static byte[]? RasterizeForPdf(byte[]? source)
    {
        if (source == null || source.Length == 0) return null;
        try
        {
            using var bmp = SKBitmap.Decode(source);
            if (bmp == null) return null;

            using var target = new SKBitmap(bmp.Width, bmp.Height);
            using var skCanvas = new SKCanvas(target);
            skCanvas.Clear(SKColors.White);
            skCanvas.DrawBitmap(bmp, 0, 0);

            using var img = SKImage.FromBitmap(target);
            using var data = img.Encode(SKEncodedImageFormat.Jpeg, 90);
            return data?.ToArray();
        }
        catch
        {
            return null;
        }
    }

    private static bool IsSvgContent(string? content)
    {
        if (string.IsNullOrEmpty(content)) return false;
        var trimmed = content.TrimStart();
        return trimmed.StartsWith("<?xml", StringComparison.OrdinalIgnoreCase)
               || trimmed.StartsWith("<svg", StringComparison.OrdinalIgnoreCase);
    }

    private static byte[]? RasterizeSvgString(string svgContent)
    {
        try
        {
            var svg = new SkiaSharp.Extended.Svg.SKSvg();
            using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(svgContent));
            svg.Load(stream);
            var picture = svg.Picture;
            if (picture == null) return null;

            var bounds = picture.CullRect;
            var width = (int)Math.Ceiling(bounds.Width);
            var height = (int)Math.Ceiling(bounds.Height);
            if (width <= 0 || height <= 0) return null;

            using var bitmap = new SKBitmap(width, height);
            using var canvas = new SKCanvas(bitmap);
            canvas.Clear(SKColors.White);
            canvas.DrawPicture(picture);

            using var img = SKImage.FromBitmap(bitmap);
            using var data = img.Encode(SKEncodedImageFormat.Png, 90);
            return data?.ToArray();
        }
        catch
        {
            return null;
        }
    }

    private static byte[]? ConvertToByteArray(string image)
    {
        try
        {
            var commaIndex = image.IndexOf(',');
            if (commaIndex < 0) return null;

            var base64 = image[(commaIndex + 1)..]
                .Replace('-', '+')
                .Replace('_', '/');

            // Fix missing base64 padding
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');

            return Convert.FromBase64String(base64);
        }
        catch
        {
            return null;
        }
    }
}