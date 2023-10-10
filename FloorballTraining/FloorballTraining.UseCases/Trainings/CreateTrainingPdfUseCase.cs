using FloorballTraining.CoreBusiness;
using FloorballTraining.Extensions;
using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using Gehtsoft.PDFFlow.Builder;
using Gehtsoft.PDFFlow.Models.Enumerations;
using Gehtsoft.PDFFlow.Models.Shared;

using System.Text;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase : ICreateTrainingPdfUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        private readonly IFileHandlingService _fileHandlingService;

        private const int DefaultFontSize = 10;
        private StyleBuilder _mainStyle = StyleBuilder.New();
        private StyleBuilder _tableCellValueStyle = StyleBuilder.New();
        private StyleBuilder _paragraphHeaderStyle = StyleBuilder.New();
        private StyleBuilder _titleStyle = StyleBuilder.New();
        private StyleBuilder _tableCellHeaderStyle = StyleBuilder.New();
        private StyleBuilder _urlStyle = StyleBuilder.New();


        public CreateTrainingPdfUseCase(ITrainingRepository trainingRepository, IFileHandlingService fileHandlingService)
        {
            _trainingRepository = trainingRepository;
            _fileHandlingService = fileHandlingService;
        }

        public async Task<byte[]?> ExecuteAsync(int trainingId)
        {

            byte[]? result = null;

            SetStyles();
            try
            {
                result = await CreatePdf(trainingId);
            }
            catch (Exception)
            {
                //throw;
            }
            return result;


        }
        private void SetStyles()
        {
            _mainStyle = StyleBuilder.New()
                .SetFontName(FontNames.Helvetica)
                .SetFontSize(DefaultFontSize)
                .SetFontEncodingName(EncodingNames.ISO8859_2)
                .SetMarginLeft(XUnit.Zero)
                .SetMarginBottom(XUnit.Zero)
                .SetMarginTop(XUnit.Zero)
                .SetMarginRight(XUnit.Zero)
                .SetHorizontalAlignment(HorizontalAlignment.Left);

            _paragraphHeaderStyle = StyleBuilder.New(_mainStyle)
                .SetFontSize(DefaultFontSize - 2)
                .SetFontBold()
                .SetMarginTop(DefaultFontSize);

            _titleStyle = StyleBuilder.New(_mainStyle)
                .SetFontSize(DefaultFontSize + 4)
                .SetHorizontalAlignment(HorizontalAlignment.Center)
                .SetMarginBottom(DefaultFontSize)
                .SetFontBold();

            _tableCellHeaderStyle = StyleBuilder.New(_mainStyle)
                .SetFontSize(DefaultFontSize - 2)
                .SetFontBold();


            _tableCellValueStyle = StyleBuilder.New(_mainStyle);

            _urlStyle = StyleBuilder.New(_mainStyle)
                .SetFontSize(DefaultFontSize - 2);
        }


        private async Task<byte[]> CreatePdf(int trainingId)
        {
            var training = await _trainingRepository.GetTrainingByIdAsync(trainingId);

            if (training == null)
            {
                throw new Exception("Trénink nenalezen");
            }

            //Create a document builder:
            var document = DocumentBuilder.New().ApplyStyle(_mainStyle);

            GenerateContent(training, document);

            //Build a file:
            using var stream = new MemoryStream();
            document.Build(stream);

            var result = stream.ToArray();
            return result;
        }

        private void GenerateContent(Training training, DocumentBuilder document)
        {
            var content = document
                .AddSection().SetSize(PaperSize.A4).SetOrientation(PageOrientation.Portrait).ApplyStyle(_mainStyle)

            /*Title*/
                .AddParagraph(training.Name).ApplyStyle(_titleStyle)
                .ToSection()

                /*Basic parameters*/
                .AddTable().SetBorder(Stroke.None)
                .AddColumnToTable().AddColumnToTable().AddColumnToTable().AddColumnToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow(Encode("Doba trvání"))
                .AddCellToRow(Encode("Počet hráčů"))
                .AddCellToRow(Encode("Věkové kategorie"), 2)
                .ToTable()
            .AddRow().ApplyStyle(_tableCellValueStyle)
            .AddCellToRow(training.Duration.ToString())
            .AddCellToRow(StringExtensions.GetRangeString(training.PersonsMin, training.PersonsMax))
                .AddCellToRow(string.Join(", ", training.GetAgeGroupNames()), 2)
                .ToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow(Encode("Obtížnost"), 2)
                .AddCellToRow(Encode("Intenzita"), 2)
                .ToTable()
            .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow($"{Difficulties.Values.Single(v => v.Value == training.Difficulty).Description}", 2)
                .AddCellToRow($"{Intensities.Values.Single(v => v.Value == training.Intesity).Description}", 2)
                .ToTable()



                .AddRow().AddCellToRow(string.Empty, 4).ToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow(Encode("Pomůcky a vybavení"), 2)
                .AddCellToRow(Encode("Zaměření"), 2).ToTable()
                .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow(string.Join(", ", training.GetEquipment()), 2)
                .AddCellToRow(string.Join(", ", training.TrainingGoal!.Name), 2)
                .ToTable().ToSection()


                /*Description*/

                .AddParagraph("Popis").ApplyStyle(_paragraphHeaderStyle).ToSection()
                .AddParagraph(training.Description).ApplyStyle(_mainStyle).ToSection()
                .AddParagraph("Komentář před zahájením").ApplyStyle(_paragraphHeaderStyle).ToSection()
                .AddParagraph(training.CommentBefore).ApplyStyle(_mainStyle).ToSection()
                .AddParagraph("Komentář po ukončení").ApplyStyle(_paragraphHeaderStyle).ToSection()
                .AddParagraph(training.CommentAfter).ApplyStyle(_mainStyle);









            AddTrainingPart(content.ToSection(), training.TrainingParts);

        }

        private void AddTrainingPart(SectionBuilder section, List<TrainingPart> trainingParts)
        {
            if (!trainingParts.Any()) return;

            var linksTable = section.AddParagraph("Odkazy").ApplyStyle(_paragraphHeaderStyle).ToSection();

            foreach (var trainingPart in trainingParts)
            {
                linksTable.AddParagraph(trainingPart.Name).ApplyStyle(_paragraphHeaderStyle);
            }
        }

        private string Encode(string text)
        {
            return Encoding.UTF8.GetString(Encoding.Default.GetBytes(text));
        }
    }
}
