using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FloorballTraining.Reporting;

/// <summary>
/// A printable A4 form for recording test results by hand: test description,
/// list of players and an empty field for each player's value.
/// </summary>
public class TestFormDocument : IDocument
{
    private readonly TestDefinitionDto _test;
    private readonly IReadOnlyList<string> _playerNames;
    private readonly string? _teamName;
    private readonly DateTime? _testDate;

    public TestFormDocument(
        TestDefinitionDto test,
        IReadOnlyList<string> playerNames,
        string? teamName = null,
        DateTime? testDate = null)
    {
        _test = test;
        _playerNames = playerNames;
        _teamName = teamName;
        _testDate = testDate;

        Settings.License = LicenseType.Community;
        Settings.CheckIfAllTextGlyphsAreAvailable = false;
    }

    /// <summary>Renders this document to PDF bytes (keeps the QuestPDF dependency inside this assembly).</summary>
    public byte[] GeneratePdfBytes() => this.GeneratePdf();

    public DocumentMetadata GetMetadata() => new()
    {
        CreationDate = DateTime.Now,
        Title = _test.Name,
        Producer = "www.flotr.cz",
        Creator = "www.flotr.cz"
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(12, Unit.Millimetre);
            page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial).FontFamily(Fonts.Calibri));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.PaddingBottom(6).Column(column =>
        {
            column.Item().Text(_test.Name).FontSize(18).Bold().FontColor(Colors.Blue.Medium);

            var meta = $"Kategorie: {CategoryLabel(_test.Category)}";
            if (!string.IsNullOrWhiteSpace(_test.Unit))
                meta += $"  •  Jednotka: {_test.Unit}";
            meta += _test.HigherIsBetter ? "  •  Vyšší = lepší" : "  •  Nižší = lepší";
            column.Item().Text(meta).FontSize(9).FontColor(Colors.Grey.Darken1);
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingTop(6).Column(column =>
        {
            column.Spacing(8);

            if (!string.IsNullOrWhiteSpace(_test.Description))
                column.Item().Text(_test.Description).FontSize(10);

            if (_test.TestType == TestType.Grade && _test.GradeOptions.Count > 0)
            {
                var options = string.Join("   •   ",
                    _test.GradeOptions.OrderBy(o => o.SortOrder).Select(o => o.Label));
                column.Item().DefaultTextStyle(x => x.FontSize(9)).Text(text =>
                {
                    text.Span("Možnosti hodnocení: ").Bold();
                    text.Span(options);
                });
            }

            column.Item().PaddingTop(2).Row(row =>
            {
                row.Spacing(20);
                row.RelativeItem().Text(text =>
                {
                    text.Span("Tým: ").Bold();
                    text.Span(string.IsNullOrWhiteSpace(_teamName) ? "______________________" : _teamName);
                });
                row.RelativeItem().Text(text =>
                {
                    text.Span("Datum: ").Bold();
                    text.Span(_testDate.HasValue ? _testDate.Value.ToString("d.M.yyyy") : "______________");
                });
                row.RelativeItem().Text(text =>
                {
                    text.Span("Zapsal: ").Bold();
                    text.Span("______________");
                });
            });

            var valueHeader = _test.TestType == TestType.Grade
                ? "Hodnocení"
                : string.IsNullOrWhiteSpace(_test.Unit) ? "Hodnota" : $"Hodnota ({_test.Unit})";

            column.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(28);
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(2);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCell).Text("#");
                    header.Cell().Element(HeaderCell).Text("Hráč");
                    header.Cell().Element(HeaderCell).Text(valueHeader);
                });

                if (_playerNames.Count > 0)
                {
                    var index = 1;
                    foreach (var name in _playerNames)
                    {
                        table.Cell().Element(BodyCell).AlignRight().Text($"{index}.").FontColor(Colors.Grey.Darken1);
                        table.Cell().Element(BodyCell).Text(name);
                        table.Cell().Element(BodyCell).Text(string.Empty);
                        index++;
                    }
                }
                else
                {
                    // No team selected — provide blank rows to fill in by hand
                    for (var i = 1; i <= 20; i++)
                    {
                        table.Cell().Element(BodyCell).AlignRight().Text($"{i}.").FontColor(Colors.Grey.Darken1);
                        table.Cell().Element(BodyCell).Text(string.Empty);
                        table.Cell().Element(BodyCell).Text(string.Empty);
                    }
                }
            });
        });
    }

    private static IContainer HeaderCell(IContainer container) =>
        container
            .Background(Colors.Grey.Lighten3)
            .Border(0.5f).BorderColor(Colors.Grey.Medium)
            .PaddingVertical(5).PaddingHorizontal(6)
            .DefaultTextStyle(x => x.Bold());

    private static IContainer BodyCell(IContainer container) =>
        container
            .Border(0.5f).BorderColor(Colors.Grey.Medium)
            .MinHeight(24)
            .PaddingVertical(5).PaddingHorizontal(6)
            .AlignMiddle();

    private void ComposeFooter(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().AlignLeft().Text("www.flotr.cz").FontSize(8).FontColor(Colors.Grey.Medium);
            row.RelativeItem().AlignRight().Text(text =>
            {
                text.Span("Strana ");
                text.CurrentPageNumber();
                text.Span(" / ");
                text.TotalPages();
            });
        });
    }

    private static string CategoryLabel(TestCategory category) => category switch
    {
        TestCategory.Conditioning => "Kondice",
        TestCategory.Technique => "Technika",
        TestCategory.Flexibility => "Flexibilita",
        TestCategory.Readiness => "Readiness",
        TestCategory.Goalkeeper => "Brankáři",
        TestCategory.BasicInfo => "Základní údaje",
        _ => category.ToString()
    };
}
