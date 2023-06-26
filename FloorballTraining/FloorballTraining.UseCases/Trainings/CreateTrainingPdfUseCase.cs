using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Gehtsoft.PDFFlow.Builder;
using Gehtsoft.PDFFlow.Models.Enumerations;
using Gehtsoft.PDFFlow.Models.Shared;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase : ICreateTrainingPdfUseCase
    {
        private readonly ITrainingRepository _trainingRepository;

        public CreateTrainingPdfUseCase(ITrainingRepository trainingRepository)
        {
            _trainingRepository = trainingRepository;
        }

        public async Task<byte[]?> ExecuteAsync(int trainingId)
        {
            var training = await _trainingRepository.GetTrainingByIdAsync(trainingId);

            if (training == null) throw new Exception("Trénink nenalezen");
            return CreatePdf(training);
        }


        private byte[] CreatePdf(Training training)
        {
            var fileName = training.Name.Replace(" ", "") + ".pdf";

            byte[]? result;

            var styleMain = StyleBuilder.New()
                .SetFontName(FontNames.Helvetica)
                .SetFontSize(12).SetFontEncodingName(EncodingNames.CP1250);

            //Create a document builder:
            var document = DocumentBuilder.New().ApplyStyle(styleMain);



            GenerateContent(training, document);

            //Build a file:
            try
            {
                using var stream = new MemoryStream();
                document.Build(stream);

                result = stream.ToArray();
            }
            catch (Exception x)
            {
                throw x;
            }
            return result;
        }

        private static void GenerateContent(Training training, DocumentBuilder document)
        {
            var table = document
                    .AddSection().SetSize(PaperSize.A4).SetOrientation(PageOrientation.Portrait)
                    .AddTable()
                    .AddColumnToTable()
                    .AddRow()
                    .AddCell(training.Name)
                    .SetHorizontalAlignment(HorizontalAlignment.Left)
                    .ToTable()
                ;

            var equipments = training.GetEquipment();

            var row2 = table.AddRow().AddCell().AddTable()
                .AddColumnToTable().AddColumnToTable()
                .AddRow().AddCellToRow("Délka").AddCell(training.Duration.ToString()).ToTable()
                .AddRow().AddCellToRow("Počet hráčů").AddCell($"{training.PersonsMin} až {training.PersonsMax}").ToTable()
                .AddRow().AddCellToRow("Pomůcky a vybavení").AddCell(string.Join(", ", equipments)).ToTable()
                .AddRow().AddCellToRow("Komentář před zahájením").AddCell(training.CommentBefore).ToTable()
                .AddRow().AddCellToRow("Komentář po ukončení").AddCell(training.CommentAfter).ToTable();




            var aktivitiesTable = row2.ToSection().AddParagraph("Tréninkové části").SetMarginTop(10).SetMarginBottom(10)
                .SetAlignment(HorizontalAlignment.Center).SetFontSize(14).ToSection().AddTable().AddColumnToTable()
                .AddColumnToTable().AddColumnToTable()
                .AddRow().SetBold().AddCellToRow("Čas").AddCellToRow("Název").AddCell("Popis").ToTable();


            foreach (var trainingPart in training.TrainingParts)
            {
                aktivitiesTable.AddRow().SetBold(false).AddCellToRow(trainingPart.Duration.ToString())
                    .AddCellToRow(trainingPart.Name).AddCell(trainingPart.Description).ToTable();


                foreach (var trainingGroup in trainingPart.TrainingGroups)
                {
                    aktivitiesTable.AddRow().AddCellToRow(trainingGroup.Name).AddCellToRow().AddCell();
                }
            }
        }
    }
}
