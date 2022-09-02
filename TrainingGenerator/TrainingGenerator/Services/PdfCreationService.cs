using Gehtsoft.PDFFlow.Builder;
using Gehtsoft.PDFFlow.Models.Enumerations;
using Gehtsoft.PDFFlow.Models.Shared;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TrainingGenerator.Models;
using static System.Net.Mime.MediaTypeNames;

namespace TrainingGenerator.Services
{
    public class PdfCreationService
    {
        public string CreatePdf(Training training)
        {
            var fileName = training.Name + "_" + DateTime.Now.ToString("yyyyMMddhhmmss") + ".pdf";


            foreach (var c in Path.GetInvalidFileNameChars())
            {
                fileName = fileName.Replace(c, '_');
            }

            var folderPath = Environment.CurrentDirectory;
            var filePath = Path.Combine(folderPath, fileName);
            if (File.Exists(filePath))
                File.Delete(filePath);

            var styleMain = StyleBuilder.New()
        .SetFontName(FontNames.Helvetica)
        .SetFontSize(12).SetFontEncodingName(EncodingNames.CP1250);




            //Create a document builder:
            var document = DocumentBuilder.New().ApplyStyle(styleMain);


            var table = document
                .AddSection().SetSize(PaperSize.A4).SetOrientation(PageOrientation.Portrait)
                    .AddTable()
                        .AddColumnToTable()
                        .AddRow()
                        .AddCell("KONSPEKT TRÉNINKOVÉ JEDNOTKY")
                        .SetHorizontalAlignment(HorizontalAlignment.Center)
                        .ToTable()
                        ;


            var accessories = new List<string>();


            var trainingActivities = training.TrainingActivities;


            if (trainingActivities.Any(ta => ta.Activity.IsFlorballBallsNeeded))
            {
                accessories.Add("florbalové míčky");
            }



            if (trainingActivities.Any(ta => ta.Activity.IsFlorballGateNeeded))
            {
                accessories.Add("florbalová branka");
            }


            if (trainingActivities.Any(ta => ta.Activity.IsResulutionDressNeeded))
            {
                accessories.Add("rozlišovací dresy");
            }
            if (trainingActivities.Any(ta => ta.Activity.IsConeNeeded))
            {
                accessories.Add("kužely");
            }
            if (trainingActivities.Any(ta => ta.Activity.IsHurdleNeeded))
            {
                accessories.Add("skočky");
            }
            if (trainingActivities.Any(ta => ta.Activity.IsJumpingLadderNeeded))
            {
                accessories.Add("skákací žebříky");
            }
            if (trainingActivities.Any(ta => ta.Activity.IsJumpingRopeNeeded))
            {
                accessories.Add("švihadla");
            }
            if (trainingActivities.Any(ta => ta.Activity.IsFootballBallNeeded))
            {
                accessories.Add("fotbalový míč");
            }








            var row2 = table.AddRow().AddCell().AddTable()
                    .AddColumnToTable().AddColumnToTable()
                    .AddRow().AddCellToRow("Poměr všestrannosti a florbalu").AddCell(100 - training.FlorbalPercent + ":" + training.FlorbalPercent).ToTable()
                    .AddRow().AddCellToRow("Délka TJ požadovaná").AddCell(training.Duration.ToString()).ToTable()
                    .AddRow().AddCellToRow("Délka TJ naplánovaná").AddCell(training.ActivitiesDuration.ToString()).ToTable()
                    .AddRow().AddCellToRow("Maximální počet hráčů").AddCell(training.PersonsMax.ToString()).ToTable()
                    .AddRow().AddCellToRow("Pomůcky a vybavení").AddCell(string.Join(", ", accessories)).ToTable();












            var aktivitiesTable = row2.ToSection().AddParagraph("Aktivity").SetMarginTop(10).SetMarginBottom(10).SetAlignment(HorizontalAlignment.Center).SetFontSize(14).ToSection().AddTable().AddColumnToTable().AddColumnToTable().AddColumnToTable()
            .AddRow().ApplyStyle(styleMain).SetBold().AddCellToRow("Čas").AddCellToRow("Název").AddCell("Popis").ToTable();


            foreach (var activity in training.TrainingActivities)
            {
                aktivitiesTable.AddRow().SetBold(false).AddCellToRow(activity.DurationMax.ToString()).AddCellToRow(activity.Activity.Name).AddCell(activity.Activity.Description).ToTable();
            }




            //Build a file:
            document.Build(filePath);

            return filePath;
        }


        private static void AddPersonInfoPartToCell(TableCellBuilder cell)
        {
            cell.AddTable()
                    .AddColumnToTable().AddColumnToTable()
                    .AddRow()
                        .AddCellToRow("Name")
                        .AddCell("photo", 1, 4)
                        .SetHorizontalAlignment(HorizontalAlignment.Center)
                        .ToTable()
                    .AddRow()
                        .AddCellToRow("Surname")
                        .AddCell().ToTable()
                    .AddRow()
                        .AddCellToRow("State")
                        .AddCell().ToTable()
                    .AddRow()
                        .AddCellToRow("City")
                        .AddCell().ToTable();
        }
        private static void AddDepartmentInfoPartToCell(TableCellBuilder cell)
        {
            cell.AddTable()
                    .AddColumnToTable().AddColumnToTable()
                    .AddRow()
                        .AddCellToRow("Name")
                        .AddCell("image", 1, 2)
                        .SetHorizontalAlignment(HorizontalAlignment.Center)
                        .ToTable()
                    .AddRow()
                        .AddCellToRow("Structure")
                        .AddCell().ToTable()
                    .AddRow()
                        .AddCellToRow("Floor")
                        .AddCell("qrcode", 1, 2)
                        .SetHorizontalAlignment(HorizontalAlignment.Center)
                        .ToTable()
                    .AddRow()
                        .AddCellToRow("Room")
                        .AddCell().ToTable();
        }

    }
}
