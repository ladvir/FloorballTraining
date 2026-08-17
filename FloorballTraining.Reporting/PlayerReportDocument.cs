using FloorballTraining.CoreBusiness.Dtos;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FloorballTraining.Reporting;

/// <summary>
/// Printable A4 player report (Feat15 #48): overview, benchmark-coloured test
/// results, canadian scoring, attendance/workouts, strengths/weaknesses, quality
/// score and optional AI recommendations. The anonymized variant carries no name,
/// birth year, contact or member id — safe to share outside the club (GDPR).
/// </summary>
public class PlayerReportDocument : IDocument
{
    private readonly PlayerReportDto _report;
    private readonly bool _anonymized;
    private readonly IReadOnlyList<AiRecommendationDto>? _recommendations;

    public PlayerReportDocument(
        PlayerReportDto report,
        bool anonymized,
        IReadOnlyList<AiRecommendationDto>? recommendations = null)
    {
        _report = report;
        _anonymized = anonymized;
        _recommendations = recommendations;

        Settings.License = LicenseType.Community;
        Settings.CheckIfAllTextGlyphsAreAvailable = false;
    }

    /// <summary>Renders this document to PDF bytes (keeps the QuestPDF dependency inside this assembly).</summary>
    public byte[] GeneratePdfBytes() => this.GeneratePdf();

    private string PlayerTitle => _anonymized
        ? "Hráč (anonymizováno)"
        : $"{_report.Member.FirstName} {_report.Member.LastName}";

    public DocumentMetadata GetMetadata() => new()
    {
        CreationDate = DateTime.Now,
        Title = $"Report hráče – {PlayerTitle}",
        Producer = "www.flotr.cz",
        Creator = "www.flotr.cz"
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(12, Unit.Millimetre);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).FontFamily(Fonts.Calibri));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.PaddingBottom(6).Column(column =>
        {
            column.Item().Text($"Report hráče – {PlayerTitle}")
                .FontSize(18).Bold().FontColor(Colors.Blue.Medium);

            var meta = new List<string>();
            if (!string.IsNullOrEmpty(_report.Member.ClubName)) meta.Add(_report.Member.ClubName);
            if (_report.Member.Teams.Count > 0) meta.Add(string.Join(", ", _report.Member.Teams));
            meta.Add(_anonymized ? $"věk: {_report.Member.Age}" : $"věk: {_report.Member.Age} (roč. {_report.Member.BirthYear})");
            if (_report.Member.Position != null) meta.Add($"pozice: {PositionLabel(_report.Member.Position)}");
            if (!_anonymized && !string.IsNullOrEmpty(_report.Member.Email)) meta.Add(_report.Member.Email);
            column.Item().Text(string.Join("  •  ", meta)).FontSize(9).FontColor(Colors.Grey.Darken1);
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingTop(4).Column(column =>
        {
            column.Spacing(10);

            column.Item().Element(ComposeSummary);
            if (_report.Tests.Count > 0) column.Item().Element(ComposeTests);
            column.Item().Element(ComposeHighlights);
            if (_recommendations is { Count: > 0 }) column.Item().Element(ComposeRecommendations);
        });
    }

    // ── Summary tiles ────────────────────────────────────────────────────────

    private void ComposeSummary(IContainer container)
    {
        container.Row(row =>
        {
            row.Spacing(6);
            Tile(row, "Hodnocení hráče",
                _report.QualityScore.HasValue ? $"{_report.QualityScore.Value:0.#}" : "—", "vážené skóre 0–100");
            Tile(row, "Kanadské body (12 měs.)",
                $"{_report.Scoring.Points}", $"{_report.Scoring.Goals} G + {_report.Scoring.Assists} A / {_report.Scoring.Games} zápasů");
            Tile(row, "Docházka",
                _report.Attendance.Pct.HasValue ? $"{_report.Attendance.Pct.Value:0.#} %" : "—",
                $"{_report.Attendance.Present} z {_report.Attendance.Total} událostí");
            Tile(row, "Individuální úkoly",
                _report.Workouts.Pct.HasValue ? $"{_report.Workouts.Pct.Value:0.#} %" : "—",
                $"{_report.Workouts.Completed} z {_report.Workouts.Assigned} splněno");
        });
    }

    private static void Tile(RowDescriptor row, string label, string value, string detail)
    {
        row.RelativeItem().Border(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(6).Column(c =>
        {
            c.Item().Text(label).FontSize(7.5f).FontColor(Colors.Grey.Darken1);
            c.Item().Text(value).FontSize(16).Bold().FontColor(Colors.Blue.Darken1);
            c.Item().Text(detail).FontSize(7.5f).FontColor(Colors.Grey.Darken1);
        });
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    private void ComposeTests(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().PaddingBottom(4).Text("Výsledky testů (posledních 12 měsíců)")
                .FontSize(12).Bold();

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);   // test
                    columns.RelativeColumn(2);   // latest
                    columns.RelativeColumn(1.5f); // level
                    columns.RelativeColumn(1.2f); // trend
                    columns.RelativeColumn(2);   // benchmark
                });

                table.Header(header =>
                {
                    foreach (var title in new[] { "Test", "Poslední výsledek", "Úroveň", "Trend", "Pásmo výborné" })
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(4)
                            .Text(title).FontSize(8.5f).Bold();
                });

                foreach (var test in _report.Tests)
                {
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                        .Text(test.Name).FontSize(9);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                        .Text(test.LatestGradeLabel
                              ?? (test.LatestValue.HasValue ? $"{test.LatestValue:0.##} {test.Unit}".Trim() : "—"))
                        .FontSize(9);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2)
                        .Background(ColourBackground(test.LatestColour)).Padding(4)
                        .Text(ColourLabel(test.LatestColour)).FontSize(9);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                        .Text(TrendLabel(test.Trend)).FontSize(9);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                        .Text(test.BenchmarkText ?? "—").FontSize(9).FontColor(Colors.Grey.Darken1);
                }
            });
        });
    }

    // ── Strengths / weaknesses ───────────────────────────────────────────────

    private void ComposeHighlights(IContainer container)
    {
        container.Row(row =>
        {
            row.Spacing(6);
            row.RelativeItem().Element(c => HighlightBox(c, "Silné stránky", _report.Strengths,
                Colors.Green.Lighten4, "Žádné výrazné silné stránky."));
            row.RelativeItem().Element(c => HighlightBox(c, "Slabé stránky", _report.Weaknesses,
                Colors.Red.Lighten4, "Žádné výrazné slabé stránky."));
        });
    }

    private static void HighlightBox(
        IContainer container, string title, List<PlayerReportHighlightDto> items,
        string background, string emptyText)
    {
        container.Border(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(6).Column(column =>
        {
            column.Item().PaddingBottom(3).Text(title).FontSize(11).Bold();
            if (items.Count == 0)
            {
                column.Item().Text(emptyText).FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                return;
            }
            foreach (var item in items)
            {
                column.Item().PaddingBottom(2).Background(background).Padding(3).Text(text =>
                {
                    text.Span(item.Name).FontSize(9).Bold();
                    var detail = item.LatestValue.HasValue
                        ? $"  {item.LatestValue:0.##} {item.Unit}".TrimEnd()
                        : "";
                    if (item.BenchmarkText != null) detail += $"  (výborné: {item.BenchmarkText})";
                    if (detail.Length > 0) text.Span(detail).FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                });
            }
        });
    }

    // ── AI recommendations ───────────────────────────────────────────────────

    private void ComposeRecommendations(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().PaddingBottom(4).Text("Doporučení rozvoje (AI)").FontSize(12).Bold();
            var index = 1;
            foreach (var recommendation in _recommendations!)
            {
                column.Item().PaddingBottom(4).Border(0.5f).BorderColor(Colors.Grey.Lighten2)
                    .Padding(6).Column(c =>
                    {
                        c.Item().Text($"{index++}. {recommendation.Title}").FontSize(10).Bold();
                        if (!string.IsNullOrWhiteSpace(recommendation.Rationale))
                            c.Item().Text(recommendation.Rationale).FontSize(9)
                                .FontColor(Colors.Grey.Darken2);
                        if (recommendation.Activities.Count > 0)
                            c.Item().PaddingTop(2)
                                .Text("Aktivity: " + string.Join(", ", recommendation.Activities.Select(a => a.ActivityName)))
                                .FontSize(8.5f).FontColor(Colors.Blue.Darken1);
                    });
            }
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Text(text =>
            {
                text.Span($"Vygenerováno {DateTime.Now:d. M. yyyy H:mm}").FontSize(8).FontColor(Colors.Grey.Medium);
                if (_anonymized)
                    text.Span("  •  anonymizovaná varianta").FontSize(8).FontColor(Colors.Grey.Medium);
            });
            row.ConstantItem(100).AlignRight().Text("www.flotr.cz").FontSize(8).FontColor(Colors.Grey.Medium);
        });
    }

    // ── Labels ───────────────────────────────────────────────────────────────

    private static string ColourBackground(string? colour) => colour switch
    {
        "green" => Colors.Green.Lighten4,
        "yellow" => Colors.Yellow.Lighten4,
        "red" => Colors.Red.Lighten4,
        _ => Colors.White,
    };

    private static string ColourLabel(string? colour) => colour switch
    {
        "green" => "výborná",
        "yellow" => "průměrná",
        "red" => "podprůměrná",
        _ => "—",
    };

    private static string TrendLabel(int? trend) => trend switch
    {
        1 => "zlepšuje se",
        -1 => "zhoršuje se",
        0 => "stagnuje",
        _ => "—",
    };

    private static string PositionLabel(string position) => position switch
    {
        "Goalie" => "brankář",
        "RightDefender" => "pravý obránce",
        "LeftDefender" => "levý obránce",
        "Center" => "centr",
        "LeftWing" => "levé křídlo",
        "RightWing" => "pravé křídlo",
        _ => position,
    };
}
