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
using IContainer = QuestPDF.Infrastructure.IContainer;

namespace FloorballTraining.Reporting;

public class TrainingDocument : IDocument
{
    private readonly IFileHandlingService _fileHandlingService;
    private readonly AppSettings _appSettings;
    private readonly string _requestedFrom;
    private readonly PdfOptions _options;

    private PageSize _pageSize = PageSizes.A4;
    public TrainingDto Model { get; }

    // Pre-computed image bytes keyed by ActivityMedia.Id — computed once before Compose()
    private readonly Dictionary<int, byte[]> _imageCache = new();

    public TrainingDocument(
        TrainingDto model,
        IFileHandlingService fileHandlingService,
        AppSettings appSettings,
        string requestedFrom,
        PdfOptions? options = null
        )
    {
        Model = model;
        _fileHandlingService = fileHandlingService;
        _appSettings = appSettings;
        _requestedFrom = requestedFrom;
        _options = options ?? new PdfOptions();
        Settings.License = LicenseType.Community;

        Settings.CheckIfAllTextGlyphsAreAvailable = false;

        if (_options.IncludeImages)
            PreloadImages();
    }

    private void PreloadImages()
    {
        foreach (var activity in Model.TrainingParts
            .SelectMany(p => p.TrainingGroups ?? [])
            .Select(g => g.Activity)
            .Where(a => a != null))
        {
            foreach (var media in activity!.ActivityMedium.Where(m => m.MediaType == CoreBusiness.Enums.MediaType.Image))
            {
                byte[]? raw = null;

                if (!string.IsNullOrEmpty(media.Path))
                {
                    var path = _fileHandlingService.GetActivityFolder2(activity.Name);
                    var imgFullPath = System.IO.Path.Combine(path, new System.IO.FileInfo(media.Path).Name);
                    if (System.IO.File.Exists(imgFullPath))
                        raw = System.IO.File.ReadAllBytes(imgFullPath);
                }

                // Try SVG content first (drawings store SVG XML in Preview)
                if (raw == null && IsSvgContent(media.Preview))
                {
                    raw = RasterizeSvgString(media.Preview);
                }

                if (raw == null && !string.IsNullOrEmpty(media.Preview))
                {
                    raw = ConvertToByteArray(media.Preview);
                }

                if (raw == null && IsSvgContent(media.Data))
                {
                    raw = RasterizeSvgString(media.Data);
                }

                if (raw == null && !string.IsNullOrEmpty(media.Data))
                {
                    raw = ConvertToByteArray(media.Data);
                }

                var pdfBytes = RasterizeForPdf(raw);
                if (pdfBytes != null)
                    _imageCache[media.Id] = pdfBytes;
            }
        }
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
                page.Size(_pageSize);
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
            .ShowOnce()
            .PaddingBottom(10)
            .Row(row =>
            {
                row.RelativeItem()
                    .AlignLeft()
                    .AlignMiddle()
                    .ExtendHorizontal()
                    .Text($"Trénink - {Model.Name}")
                    .FontSize(16)
                    .Bold()
                    .FontColor(Colors.Green.Darken3);

                if (!string.IsNullOrEmpty(_requestedFrom))
                    row.RelativeItem().ContentFromRightToLeft().AlignRight().AlignMiddle().ExtendHorizontal().Width(24).Image(GenerateQRCode(_requestedFrom));
            });
    }

    void ComposeContent(IContainer container)
    {
        container.Column(column =>
        {
            if (_options.IncludeTrainingParameters)
            {
                column.Item().Row(row =>
                {
                    row.Spacing(4);

                    row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Věk. kateg.",
                        string.Join(", ", Model.TrainingAgeGroups.Select(ag => ag.Name).OrderBy(ag => ag)),
                        "group.png"));
                    row.RelativeItem().ScaleToFit().Element((e) =>
                        RoundedInfoBox(e, "Doba trvání", Model.Duration.ToString(), "sandglass.png"));
                    row.RelativeItem().ScaleToFit().Element((e) =>
                        RoundedInfoBox(e, "Intenzita", Intensities.Descriptions[Model.Intensity], "thermostat.png"));
                    row.RelativeItem().ScaleToFit().Element((e) =>
                        RoundedInfoBox(e, "Obtížnost", Difficulties.Descriptions[Model.Difficulty], "pulse.svg"));
                });
            }

            if (_options.IncludeTrainingDetails)
            {
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.Spacing(4);
                    row.RelativeItem().Element((e) =>
                        RoundedInfoBox(e, "Zaměření", Model.GetTrainingGoalsAsString(), "tags.png", HorizontalAlignment.Left));

                    row.RelativeItem().Element((e) => RoundedInfoBox(e, "Vybavení", string.Join(", ", Model.GetEquipment()),
                        "equipment.png", HorizontalAlignment.Left));

                    row.RelativeItem().Element((e) => RoundedInfoBox(e, "Prostředí", Model.Environment.ToString(),
                        "location.png", HorizontalAlignment.Left));
                });
            }

            //Description
            if (_options.IncludeTrainingDescription && !string.IsNullOrEmpty(Model.Description))
            {
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.RelativeItem().Element((e) =>
                    {
                        RoundedInfoBox(e, "Popis", Model.Description, "task.png", HorizontalAlignment.Left);
                    });
                });
            }

            //Comment before
            if (_options.IncludeComments && !string.IsNullOrEmpty(Model.CommentBefore))
            {
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.RelativeItem().Element((e) =>
                    {
                        RoundedInfoBox(e, "Komentář před zahájením", Model.CommentBefore, "task.png",
                            HorizontalAlignment.Left);
                    });
                });
            }

            //Comment after
            if (_options.IncludeComments && !string.IsNullOrEmpty(Model.CommentAfter))
            {
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.RelativeItem().Element((e) =>
                    {
                        RoundedInfoBox(e, "Komentář po ukončení", Model.CommentAfter, "task.png",
                            HorizontalAlignment.Left);
                    });
                });
            }

            //Training parts

            column.Item().PaddingTop(5).Row(row =>
            {
                row.AutoItem().Column(c =>
                {

                    var i = Model.TrainingParts.Count;
                    foreach (var trainingPart in Model.TrainingParts)
                    {
                        c.Item().PaddingBottom(--i == 0 ? 0 : 30).Element((e) => AddTrainingPart(e, trainingPart));
                    }
                });
            });

        });
    }

    private void AddTrainingPart(IContainer container, TrainingPartDto trainingPart)
    {
        container.PaddingVertical(5).Column(c =>
        {
            c.Item().PaddingBottom(10).Text($"{trainingPart.Duration} min. - {trainingPart.Name}").FontSize(12).Bold().FontColor(Colors.Blue.Darken4);

            if (_options.IncludePartDescriptions && !string.IsNullOrEmpty(trainingPart.Description))
            {
                c.Item().PaddingVertical(5).Element(e =>
                {
                    RoundedInfoBox(e, "Popis", trainingPart.Description, "task.png", HorizontalAlignment.Left, true);
                });
            }

            c.Item().Shrink().Element(e =>
            {

                e.Column(column =>
                {
                    column.Spacing(15);
                    var i = 0;
                    foreach (var trainingGroup in trainingPart.TrainingGroups!.Where(tg => tg.Activity != null))
                    {
                        ComposeContentForTrainingGroup(column.Item(), trainingGroup, ++i, trainingPart.TrainingGroups!.Count);
                    }
                });
            });
        });
    }
    void ComposeContentForTrainingGroup(IContainer container, TrainingGroupDto trainingGroupDto, int i, int totalGroups)
    {

        container
            .Layers(layers =>
            {
                layers.Layer().SkiaSharpCanvas((canvas, size) =>
                {
                    DrawRoundedRectangle(canvas, size, Colors.White, false);
                    DrawRoundedRectangle(canvas, size, Colors.Grey.Medium, true);
                });

                layers.PrimaryLayer().Width(548).PaddingVertical(5).Shrink().PaddingHorizontal(5).Element((x) =>
                    x.Column(column =>
                        {
                            column.Spacing(5);
                            column.Item().Shrink().ScaleToFit().Text(text => text.Span((totalGroups > 1 ? $"Skupina {i} - " : string.Empty) + trainingGroupDto.Activity!.Name).Bold());

                            column.Item().Shrink().PaddingTop(3).Element(e => ComposeContentForActivity(e, trainingGroupDto.Activity!));
                        })
                    );
            });
    }


    void ComposeContentForActivity(IContainer container, ActivityDto activity)
    {
        container.Column(cc =>
        {
            if (_options.IncludeActivityDescriptions && !string.IsNullOrEmpty(activity.Description))
                cc.Item().Shrink().Text(activity.Description).AlignLeft();

            if (_options.IncludeImages)
            {
                foreach (var imageMedia in activity.ActivityMedium.Where(m => m.MediaType == MediaType.Image))
                {
                    if (_imageCache.ContainsKey(imageMedia.Id))
                        cc.Item().Element(e => AddImage(e, imageMedia));
                }
            }
        });
    }


    private void RoundedInfoBox(IContainer container, string label, string value, string imagePath,
        HorizontalAlignment alignment = HorizontalAlignment.Center, bool isFullWidth = false)
    {
        container
            .Layers(layers =>
            {
                layers.Layer().SkiaSharpCanvas((canvas, size) =>
                {
                    DrawRoundedRectangle(canvas, size, Colors.White, false);
                    DrawRoundedRectangle(canvas, size, Colors.Grey.Medium, true);
                });

                var l = layers.PrimaryLayer();

                l = isFullWidth ? l.Width(500) : l;

                l.PaddingVertical(5)
                .PaddingHorizontal(5)

                .Element((x) =>
                    x.Column(column =>
                    {
                        column.Item().Shrink().ScaleToFit().Row(row =>
                        {
                            row.Spacing(4);

                            SetIcon(imagePath, row);//Icon

                            row.RelativeItem().Shrink().AlignMiddle().PaddingTop(2).Text(text =>
                            {
                                text.AlignLeft();
                                text.Span(label).Bold();
                            });
                        });

                        column.Item().Shrink().PaddingTop(3).ExtendHorizontal().Text(text =>
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
        if (string.IsNullOrEmpty(imagePath)) return;
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

    private byte[] GenerateQRCode(string path)
    {
        var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(path, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }

    private void AddImage(IContainer container, ActivityMediaDto imageMedia)
    {
        if (_imageCache.TryGetValue(imageMedia.Id, out var pdfBytes))
            container.Width(16, Unit.Centimetre).Image(pdfBytes).FitWidth();
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