﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.Services;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FloorballTraining.UseCases
{
    public class TrainingDocument : IDocument
    {
        private readonly IFileHandlingService _fileHandlingService;

        public Training Model { get; }

        
        public TrainingDocument(Training model, IFileHandlingService fileHandlingService)
        {
            Model = model;
            _fileHandlingService = fileHandlingService;

            QuestPDF.Settings.License = LicenseType.Community;

            Settings.CheckIfAllTextGlyphsAreAvailable = false;
        }

        public DocumentMetadata GetMetadata() => new DocumentMetadata{
            CreationDate = DateTime.Now,
            Title = Model.Name,
            Producer = "FloorballTraining",
            Creator = "FloorballTrainig"
        };

        public DocumentSettings GetSettings() => new DocumentSettings{
            ImageCompressionQuality = ImageCompressionQuality.Medium,
            
        };

        public void Compose(IDocumentContainer container)
        {
            container
                .Page(page =>
                {
                    page.DefaultTextStyle(x => x.FontSize(20).FontFamily(Fonts.Arial).Fallback(x => x.FontFamily(Fonts.Calibri)).Fallback(x => x.FontFamily(Fonts.Verdana))) ;
                    page.Margin(50);
                    

                    container
            .Page(page =>
            {
                page.Margin(50);

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);


                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
                });
        }


        void ComposeHeader(IContainer container)
        {
            var titleStyle = TextStyle.Default.FontFamily(QuestPDF.Helpers.Fonts.Cambria).FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);

            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(Model.Name).Style(titleStyle);

                    /*column.Item().Text(text =>
                    {
                        text.Span("Issue date: ").SemiBold();
                        text.Span($"{Model.IssueDate:d}");
                    });

                    column.Item().Text(text =>
                    {
                        text.Span("Due date: ").SemiBold();
                        text.Span($"{Model.DueDate:d}");
                    });*/
                });

                row.ConstantItem(100).Height(50).Placeholder();
            });
        }

        void ComposeContent(IContainer container)
        {

            container.Border(1)
.Table(table =>
{
    table.ColumnsDefinition(columns =>
    {
        columns.RelativeColumn();
        columns.RelativeColumn();
        columns.RelativeColumn();
        columns.RelativeColumn();
    });

    // by using custom 'Element' method, we can reuse visual configuration
    table.Cell().Row(1).Column(4).Element(Block).Text("A");
    table.Cell().Row(2).Column(2).Element(Block).Text("B");
    table.Cell().Row(3).Column(3).Element(Block).Text("C");
    table.Cell().Row(4).Column(1).Element(Block).Text("D");

    // for simplicity, you can also use extension method described in the "Extending DSL" section
    static IContainer Block(IContainer container)
    {
        return container
            .Border(1)
            .Background(Colors.Grey.Lighten3)
            .ShowOnce()
            .MinWidth(50)
            .MinHeight(50)
            .AlignCenter()
            .AlignMiddle();
    }
});


        }

    }
}