using FloorballTraining.CoreBusiness;
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

    public Training Model { get; }


    public TrainingDocument(
        Training model,
        IFileHandlingService fileHandlingService,
        AppSettings appSettings,
        string requestedFrom

        )
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

                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Věk. kategorie",
                    string.Join(", ", Model.TrainingAgeGroups.Select(ag => ag.AgeGroup?.Name).OrderBy(ag => ag)),
                    "group.png"));
                row.RelativeItem().ScaleToFit().Element((e) =>
                    RoundedInfoBox(e, "Doba trvání", Model.Duration.ToString(), "sandglass.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Počet osob",
                    StringExtensions.GetRangeString(Model.PersonsMin, Model.PersonsMax), "peoplecom.svg"));
                row.RelativeItem().ScaleToFit().Element((e) =>
                    RoundedInfoBox(e, "Intenzita", Intensities.Descriptions[Model.Intesity], "thermostat.png"));
                row.RelativeItem().ScaleToFit().Element((e) =>
                    RoundedInfoBox(e, "Obtížnost", Difficulties.Descriptions[Model.Difficulty], "pulse.svg"));
            });

            column.Item().PaddingVertical(4).Row(row =>
            {

                row.Spacing(4);
                row.RelativeItem().Element((e) =>
                    RoundedInfoBox(e, "Zaměření", Model.TrainingGoal!.Name, "tags.png", HorizontalAlignment.Left));

                row.RelativeItem().Element((e) => RoundedInfoBox(e, "Vybavení", string.Join(", ", Model.GetEquipment()),
                    "equipment.png", HorizontalAlignment.Left));

                
                row.RelativeItem().Element((e) => RoundedInfoBox(e, "Místo", Model.Place!.ToString(),
                    "location.png", HorizontalAlignment.Left));
            });

            //Description
            if (!string.IsNullOrEmpty(Model.Description))
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
            if (!string.IsNullOrEmpty(Model.CommentBefore))
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

            //Description
            if (!string.IsNullOrEmpty(Model.CommentAfter))
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
            if (Model.TrainingParts != null)
            {
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.AutoItem().Column(c =>
                    {

                        foreach (var trainingPart in Model.TrainingParts)
                        {
                            c.Item().Element((e) => AddTrainingPart(e, trainingPart));
                        }
                    });
                });
            }

        });

    }

    private void AddTrainingPart(IContainer container, TrainingPart trainingPart)
    {
        container.PaddingVertical(10)
            .Column(c =>
        {

            c.Item().Text($"{trainingPart.Duration} min. - {trainingPart.Name}").FontSize(12).Bold();

            if (!string.IsNullOrEmpty(trainingPart.Description))
            {
                c.Item().PaddingVertical(5).Element(e =>
                {
                    RoundedInfoBox(e, "Popis", trainingPart.Description, "task.png", HorizontalAlignment.Left, true);
                });
            }


            c.Item()
                .MinimalBox()
                .Border(1)

                .Table(table =>
                {
                    IContainer DefaultCellStyle(IContainer tt, string backgroundColor)
                    {
                        return tt
                            .Border(1)
                            .BorderColor(Colors.Grey.Lighten1)
                            .Background(backgroundColor)
                            .PaddingVertical(5)
                            .PaddingHorizontal(10)
                            .AlignLeft()
                            .AlignMiddle();
                    }

                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(75);
                        columns.ConstantColumn(450);
                    });

                    table.Header(header =>
                    {
                        // please be sure to call the 'header' handler!

                        header.Cell().Element(CellStyle).AlignLeft().Text("Počet osob");

                        header.Cell().Element(CellStyle).Text("Aktivita");
                        return;
                        // you can extend existing styles by creating additional methods
                        IContainer CellStyle(IContainer ss) => DefaultCellStyle(ss, Colors.Grey.Lighten3);
                    });

                    foreach (var page in trainingPart.TrainingGroups.SelectMany(t => t.TrainingGroupActivities))
                    {

                        table.Cell().Element(CellStyle).AlignCenter().MinimalBox()
                            .Text(StringExtensions.GetRangeString(page.TrainingGroup!.PersonsMin, page.TrainingGroup.PersonsMax));
                        table.Cell().Element(CellStyle).MinimalBox().AlignLeft().Text(page.Activity!.Name);

                        continue;
                        IContainer CellStyle(IContainer cc) =>
                            DefaultCellStyle(cc, Colors.White).ShowOnce();
                    }

                });
        });
    }


    private void RoundedInfoBox(IContainer container, string label, string value, string imagePath,
        HorizontalAlignment alignment = HorizontalAlignment.Center, bool isFullWidth = false)
    {
        container
            .Layers(layers =>
            {
                layers.Layer().Canvas((canvas, size) =>
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
                        column.Item().MinimalBox().ScaleToFit().Row(row =>
                        {
                            row.Spacing(4);

                            SetIcon(imagePath, row);//Icon

                            row.RelativeItem().MinimalBox().AlignMiddle().PaddingTop(2).Text(text =>
                            {
                                text.AlignLeft();
                                text.Span(label).Bold();
                            });
                        });

                        column.Item().MinimalBox().PaddingTop(3).Text(text =>
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