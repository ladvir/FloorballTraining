using Gehtsoft.PDFFlow.Builder;
using Gehtsoft.PDFFlow.Models.Enumerations;
using TrainingDataAccess.Models;
using TrainingDataAccess.Services.TrainingServices;
using HorizontalAlignment = MudBlazor.HorizontalAlignment;

namespace TrainingCreator.Services
{
    public class PdfCreationService
    {
        private readonly ITrainingService _trainingService;

        public PdfCreationService(ITrainingService trainingService)
        {
            _trainingService = trainingService;
        }

        public Task<string> CreatePdf(int trainingId)
        {
            var training = _trainingService.GetTrainingFull(trainingId).Result;

            var equipments = training.GetNeededEquipment();

            return Task.FromResult(CreatePdf(training));
        }
        public string CreatePdf(Training training)
        {
            var fileName = training.Name.Replace(" ", "") + "_" + DateTime.Now.ToString("yyyyMMddhhmmss") + ".pdf";


            foreach (var c in Path.GetInvalidFileNameChars())
            {
                fileName = fileName.Replace(c, '_');
            }

            var folderPath = Environment.CurrentDirectory;
            var filePath = Path.Combine(folderPath, fileName);
            if (File.Exists(filePath))
                File.Delete(filePath);



            //Create a document builder:
            var document = DocumentBuilder.New();


            var table = document
                .AddSection().SetSize(PaperSize.A4).SetOrientation(PageOrientation.Portrait)
                    .AddTable()
                        .AddColumnToTable()
                        .AddRow()
                        .AddCell(training.Name)
                        .SetHorizontalAlignment(Gehtsoft.PDFFlow.Models.Enumerations.HorizontalAlignment.Left)
                        .ToTable()
                        ;


            var equipments = training.GetNeededEquipment();





            var row2 = table.AddRow().AddCell().AddTable()
                    .AddColumnToTable().AddColumnToTable()
                    .AddRow().AddCellToRow("Délka TJ požadovaná").AddCell(training.Duration.ToString()).ToTable()
                    .AddRow().AddCellToRow("Délka TJ naplánovaná").AddCell(training.GetActivitiesDurationMin().ToString()).ToTable()
                    .AddRow().AddCellToRow("Maximální počet hráčů").AddCell(training.Persons.ToString()).ToTable()
                    .AddRow().AddCellToRow("Pomůcky a vybavení").AddCell(string.Join(", ", equipments)).ToTable();












            var aktivitiesTable = row2.ToSection().AddParagraph("Aktivity").SetMarginTop(10).SetMarginBottom(10).SetAlignment((Gehtsoft.PDFFlow.Models.Enumerations.HorizontalAlignment)HorizontalAlignment.Center).SetFontSize(14).ToSection().AddTable().AddColumnToTable().AddColumnToTable().AddColumnToTable()
            .AddRow().SetBold().AddCellToRow("Čas").AddCellToRow("Název").AddCell("Popis").ToTable();


            foreach (var activity in training.GetActivities())
            {
                aktivitiesTable.AddRow().SetBold(false).AddCellToRow(activity.DurationMax.ToString()).AddCellToRow(activity.Name).AddCell(activity.Description).ToTable();
            }




            //Build a file:
            document.Build(filePath);

            return filePath;
        }



    }
}
