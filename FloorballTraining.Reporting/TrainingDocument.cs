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

    private PageSize _pageSize = PageSizes.A4;
    public TrainingDto Model { get; }


    public TrainingDocument(
        TrainingDto model,
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
            column.Item().Row(row =>
            {
                row.Spacing(4);

                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Věk. kateg.",
                    string.Join(", ", Model.TrainingAgeGroups.Select(ag => ag.Name).OrderBy(ag => ag)),
                    "group.png"));
                row.RelativeItem().ScaleToFit().Element((e) =>
                    RoundedInfoBox(e, "Doba trvání", Model.Duration.ToString(), "sandglass.png"));
                row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Počet osob",
                    StringExtensions.GetRangeString(Model.PersonsMin, Model.PersonsMax, "", Model.GoaliesMin, Model.GoaliesMax, " G", "-"), "peoplecom.svg"));
                row.RelativeItem().ScaleToFit().Element((e) =>
                    RoundedInfoBox(e, "Intenzita", Intensities.Descriptions[Model.Intensity], "thermostat.png"));
                row.RelativeItem().ScaleToFit().Element((e) =>
                    RoundedInfoBox(e, "Obtížnost", Difficulties.Descriptions[Model.Difficulty], "pulse.svg"));
            });

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

            //Comment after
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

            if (!string.IsNullOrEmpty(trainingPart.Description))
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

                            column.Item().Shrink().ScaleToFit().Text(text =>
                                text.Span(StringExtensions.GetRangeString(trainingGroupDto.PersonsMin,
                                    trainingGroupDto.PersonsMax, "", trainingGroupDto.GoaliesMin,
                                    trainingGroupDto.GoaliesMax, " G", "-")));

                            column.Item().Shrink().PaddingTop(3).Element(e => ComposeContentForActivity(e, trainingGroupDto.Activity!));
                        })
                    );
            });
    }


    void ComposeContentForActivity(IContainer container, ActivityDto activity)
    {

        container.Column(cc =>
        {
            //Description
            if (!string.IsNullOrEmpty(activity.Description))
            {
                cc.Item().Shrink().Text(activity.Description).AlignLeft();
            }

            //Images
            var images = activity.ActivityMedium.Where(m => m.MediaType == MediaType.Image);

            if (images.Any())
            {
                cc.Item().Column(c =>
                    {
                        c.Item().Shrink().Row((e) =>
                        {
                            e.Spacing(5);

                            foreach (var imageMedia in images)
                            {
                                AddImage(e.AutoItem(), imageMedia);
                            }
                        });
                    }
                );
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
        container.Row(row =>
        {
            if (!string.IsNullOrEmpty(imageMedia.Path))
            {
                var theActivity = Model.TrainingParts.SelectMany(t => t.TrainingGroups ?? []).FirstOrDefault(g => g.Activity?.Id == imageMedia.ActivityId)?.Activity;

                if (theActivity == null) return;
                var path = _fileHandlingService.GetActivityFolder2(theActivity.Name);

                var fi = new FileInfo(imageMedia.Path);
                var imgFullPath = Path.Combine(path, fi.Name);

                if (!File.Exists(imgFullPath))
                {


                    try
                    {
                        row.AutoItem().Width(8, Unit.Centimetre).Shrink().Image(imgFullPath).FitArea();
                    }
                    catch
                    {
                        //ignore

                    }
                }
            }
            else if (!string.IsNullOrEmpty(imageMedia.Preview))
            {
                var image = ConvertToByteArray(imageMedia.Preview);

                if (image != null)
                {
                    row.AutoItem().Width(8, Unit.Centimetre).Shrink().Image(image).FitArea();
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