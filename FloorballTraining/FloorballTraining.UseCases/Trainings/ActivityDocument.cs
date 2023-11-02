using System.Text;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Extensions;
using FloorballTraining.Services;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SkiaSharp;

namespace FloorballTraining.UseCases
{
    public class ActivityDocument : IDocument
    {
        private readonly IFileHandlingService _fileHandlingService;

        public Activity Model { get; }


        public ActivityDocument(Activity model, IFileHandlingService fileHandlingService)
        {
            Model = model;
            _fileHandlingService = fileHandlingService;

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
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).Fallback(x => x.FontFamily(Fonts.Calibri)).Fallback(x => x.FontFamily(Fonts.Verdana)));
                    page.Margin(1, Unit.Centimetre);

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(ComposeContent);

                    page.Footer().Element(ComposeFooter);
                });

        }

        private void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Text(x =>
             {
                 x.CurrentPageNumber();
                 x.Span(" / ");
                 x.TotalPages();
             });
        }

        void ComposeHeader(IContainer container)
        {
            container
                .MinimalBox()
                        .PaddingBottom(10)
                        .Text(Model.Name)
                        .FontSize(16)
                        .Bold()
                        .FontColor(Colors.Blue.Medium);
        }

        void ComposeContent(IContainer container)
        {
            container.Column(column =>
            {
                column.Item().Row(row =>
                {
                    row.Spacing(4);

                    row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Věkové kategorie", string.Join(", ", Model.ActivityAgeGroups.Select(ag => ag.AgeGroup?.Name).OrderBy(ag => ag)), "wwwroot/assets/ball_ico.png"));
                    row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Doba trvání", StringExtensions.GetRangeString(Model.DurationMin, Model.DurationMax), "wwwroot/assets/ball_ico.png"));
                    row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Počet osob", StringExtensions.GetRangeString(Model.PersonsMin, Model.PersonsMax), "wwwroot/assets/ball_ico.png"));
                    row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Intenzita", Intensities.Descriptions[Model.Intesity], "wwwroot/assets/ball_ico.png"));
                    row.RelativeItem().ScaleToFit().Element((e) => RoundedInfoBox(e, "Obtížnost", Difficulties.Descriptions[Model.Difficulty], "wwwroot/assets/ball_ico.png"));
                });

                column.Item().PaddingVertical(4).Row(row =>
                {

                    row.Spacing(4);
                    row.RelativeItem().Element((e) => RoundedInfoBox(e, "Štítky", string.Join(", ", Model.ActivityTags.Select(ag => ag.Tag?.Name).OrderBy(ag => ag)), "wwwroot/assets/gate_ico.png", HorizontalAlignment.Left));
                    row.RelativeItem().Element((e) => RoundedInfoBox(e, "Vybavení", string.Join(", ", Model.ActivityEquipments.Select(ae => ae.Equipment?.Name).OrderBy(e => e)), "wwwroot/assets/ball_ico.png", HorizontalAlignment.Left));
                });

                //Description
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.RelativeItem().Element((e) =>
                    {
                        if (Model.Description != null)
                            RoundedInfoBox(e, "Popis", Model.Description, "wwwroot/assets/gate_ico.png", HorizontalAlignment.Left);
                    });
                });

                //Images
                column.Item().PaddingVertical(4).Row(row =>
                {
                    
                    row.AutoItem().Column(c => {
                        foreach (var imageMedia in Model.ActivityMedium.Where(m => m.MediaType == MediaType.Image).ToList())
                        {
                            c.Item().Element((e) => AddImage(e, imageMedia));
                        }
                    });
                    
                });

                //URLs
                column.Item().PaddingVertical(4).Row(row =>
                {
                    row.RelativeItem().ExtendHorizontal().Element(AddUrls);
                });


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
                        .PaddingVertical(2)
                        .PaddingHorizontal(2)
                        .Element((x) =>
                           x.Column(column =>
                           {
                               column.Item().MinimalBox().ScaleToFit().Row(row =>
                               {
                                   row.ConstantItem(24).AlignMiddle().Image(imagePath).FitWidth();
                                   row.RelativeItem().AlignMiddle().Text(text =>
                                   {
                                       text.AlignLeft();
                                       text.Span(label)
                                           .Bold();
                                   });
                               });

                               column.Item().Text(text =>
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

        void DrawRoundedRectangle(SKCanvas canvas, Size size, string color, bool isStroke)
        {
            using var paint = new SKPaint();
            paint.Color = SKColor.Parse(color);
            paint.IsStroke = isStroke;
            paint.StrokeWidth = 1;
            paint.IsAntialias = true;
            canvas.DrawRoundRect(0, 0, size.Width, size.Height, 5, 5, paint);
        }

        private void AddUrls(IContainer container)
        {
            var urls = Model.ActivityMedium.Where(m => m.MediaType == MediaType.URL).ToList();

            if (!urls.Any()) return;

            foreach (var urlMedia in urls)
            {
                container
                    .Padding(10)
                    .Hyperlink(urlMedia.Path)
                    .Text(urlMedia.Path);
            }
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
}
