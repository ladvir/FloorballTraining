using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
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

    public ActivityDto Model { get; }

    public ActivityDocument(ActivityDto model, IFileHandlingService fileHandlingService, AppSettings appSettings, string requestedFrom)
    {
        Model = model;
        _fileHandlingService = fileHandlingService;
        _appSettings = appSettings;
        _requestedFrom = requestedFrom;

        Settings.License = LicenseType.Community;

        Settings.CheckIfAllTextGlyphsAreAvailable = false;
    }

    public DocumentMetadata GetMetadata() => new()
    {
        CreationDate = DateTime.Now,
        Title = Model.Name,
        Producer = "FloorballTraining",
        Creator = "FloorballTraining"

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
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).Fallback(y => y.FontFamily(Fonts.Calibri)).Fallback(y => y.FontFamily(Fonts.Verdana)));
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
                row.RelativeItem().AlignLeft().ExtendHorizontal().Text("Vytvořeno ve FloorballTraining");

                row.RelativeItem().ContentFromRightToLeft().AlignRight().ExtendHorizontal().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            }
        );
    }

    void ComposeHeader(IContainer container)
    {
        container
            .MinimalBox()
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

                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Věk. kategorie", string.Join(", ", Model.ActivityAgeGroups.Select(ag => ag.Name).OrderBy(ag => ag)), "group.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Doba trvání", StringExtensions.GetRangeString(Model.DurationMin, Model.DurationMax), "sandglass.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Počet osob", StringExtensions.GetRangeString(Model.PersonsMin, Model.PersonsMax), "peoplecom.svg"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Intenzita", Intensities.Descriptions[Model.Intensity], "thermostat.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Obtížnost", Difficulties.Descriptions[Model.Difficulty], "pulse.svg"));
            });

            column.Item().PaddingVertical(4).Row(row =>
            {

                row.Spacing(4);
                row.RelativeItem().Element((e) => RoundedInfoBox(e, "Štítky", string.Join(", ", Model.ActivityTags.Select(ag => ag.Name).OrderBy(ag => ag)), "tags.png", HorizontalAlignment.Left));
                row.RelativeItem().Element((e) => RoundedInfoBox(e, "Vybavení", string.Join(", ", Model.ActivityEquipments.Select(ae => ae.Name).OrderBy(o => o)), "equipment.png", HorizontalAlignment.Left));
            });

            //Description
            column.Item().PaddingVertical(4).Row(row =>
            {
                row.RelativeItem().Element((e) =>
                {
                    if (Model.Description != null)
                        RoundedInfoBox(e, "Popis", Model.Description, "task.png", HorizontalAlignment.Left);
                });
            });

            //Images
            //column.Item().PaddingVertical(4).Row(row =>
            //{

            //    row.AutoItem().Column(c =>
            //    {
            //        foreach (var imageMedia in Model.ActivityMedium.Where(m => m.MediaType == MediaType.Image).ToList())
            //        {
            //            c.Item().Element((e) => AddImage(e, imageMedia));
            //        }
            //    });

            //});

            //URLs
            //column.Item().PaddingVertical(4).Row(row =>
            //{
            //    row.RelativeItem().ExtendHorizontal().Element(AddUrls);
            //});


        });

    }

    private void RoundedInfoBox(IContainer container, string label, string value, string imagePath, HorizontalAlignment alignment = HorizontalAlignment.Center)
    {
        container
            .Layers(layers =>
            {
                layers.Layer().Canvas((canvas, size) =>
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
                            column.Item().MinimalBox().ScaleToFit().Row(row =>
                            {
                                row.Spacing(4);

                                SetIcon(imagePath, row);

                                row.RelativeItem().MinimalBox().AlignMiddle().PaddingTop(2).Text(text =>
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

        row.ConstantItem(16).MinimalBox().Width(16).Image(_appSettings.AssetsPath + imagePath);

    }

    private void TryLoadSvgNoException(string imagePath, RowDescriptor row)
    {
        try
        {
            var svg = new SkiaSharp.Extended.Svg.SKSvg(new SKSize(16, 16));

            svg.Load(_appSettings.AssetsPath + imagePath);

            row.ConstantItem(16).MinimalBox().Svg(svg);
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


    //                row.ConstantItem(24).AlignMiddle().MinimalBox().Width(24).Image(GenerateQRCode(urlMedia.Path));

    //                row.RelativeItem().AlignMiddle().MinimalBox().AlignMiddle().PaddingTop(2).Hyperlink(urlMedia.Path).Text(urlMedia.Path);

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

    private void AddImage(IContainer container, ActivityMedia imageMedia)
    {
        container.Row(row =>
        {

            if (!string.IsNullOrEmpty(imageMedia.Path))
            {
                var path = _fileHandlingService.GetActivityFolder2(Model.Name);

                var fi = new FileInfo(imageMedia.Path);
                var imgFullPath = Path.Combine(path, fi.Name);

                row.AutoItem().Width(8, Unit.Centimetre).Image(imgFullPath).FitWidth();
            }
            else if (!string.IsNullOrEmpty(imageMedia.Preview))
            {
                var image = ConvertToByteArray(imageMedia.Preview);

                if (image != null)
                {
                    row.AutoItem().Width(8, Unit.Centimetre).Image(image).FitWidth();
                }
            }
        });
    }

    private byte[]? ConvertToByteArray(string image)
    {
        var imageData = image.Split(",");

        if (imageData.Length <= 1) return null;

        var img = imageData[1].Replace('-', '+').Replace('_', '/');

        return Convert.FromBase64String(img);
    }
}