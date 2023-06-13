using FloorballTraining.CoreBusiness;
using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using Gehtsoft.PDFFlow.Builder;
using Gehtsoft.PDFFlow.Models.Enumerations;
using Gehtsoft.PDFFlow.Models.Shared;

namespace FloorballTraining.UseCases.Activities
{
    public class CreateActivityPdfUseCase : ICreateActivityPdfUseCase
    {
        private readonly IActivityRepository _activityRepository;
        private readonly IFileHandlingService _fileHandlingService;


        public CreateActivityPdfUseCase(
            IActivityRepository activityRepository,
            IFileHandlingService fileHandlingService)
        {
            _activityRepository = activityRepository;
            _fileHandlingService = fileHandlingService;
        }

        public async Task<byte[]?> ExecuteAsync(int activityId)
        {
            var activity = await _activityRepository.GetActivityByIdAsync(activityId);

            if (activity == null) throw new Exception("Aktivita nenalezena");
            return CreatePdf(activity);
        }


        private byte[]? CreatePdf(Activity activity)
        {
            var fileName = activity.Name.Replace(" ", "") + ".pdf";

            byte[]? result;

            var styleMain = StyleBuilder.New()
                .SetFontName(FontNames.Helvetica)
                .SetFontSize(12).SetFontEncodingName(EncodingNames.CP1250);

            //Create a document builder:
            var document = DocumentBuilder.New().ApplyStyle(styleMain);



            GenerateContent(activity, document);

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

        private void GenerateContent(Activity activity, DocumentBuilder document)
        {

            var fontSymbol = FontBuilder.New().SetName(FontNames.Times).SetSize(14);

            var content = document
                 .AddSection().SetSize(PaperSize.A4).SetOrientation(PageOrientation.Portrait).SetStyleFont(fontSymbol)

                 /*Title*/
                 .AddParagraph(activity.Name).SetAlignment(HorizontalAlignment.Center).SetMarginTop(10)
                 .SetMarginBottom(10).SetFontSize(16).SetBold()
                 .ToSection()

                 /*Basic parameters*/


                 .AddTable()
                 .AddColumnToTable().AddColumnToTable()
                 .AddRow().AddCellToRow("Doba trvání").AddCell($"{activity.DurationMin} - {activity.DurationMax}").ToTable()
                 .AddRow().AddCellToRow("Věkové kategorie").AddCell(string.Join(", ", activity.GetAgeGroupNames()))
                 .ToTable()

                 .AddRow().AddCellToRow("Počet hráčů").AddCell($"{activity.PersonsMin} - {activity.PersonsMax}")
                 .ToTable()


                 .AddRow().AddCellToRow("Pomůcky a vybavení").AddCell(string.Join(", ", activity.GetEquipmentNames()))
                 .ToTable()

                 .AddRow().AddCellToRow("Štítky").AddCell(string.Join(", ", activity.GetTagNames())).ToTable();





            var linksTable = content.ToSection().AddParagraph("Odkazy").SetMarginTop(10).SetMarginBottom(10)
                .SetAlignment(HorizontalAlignment.Left).SetFontSize(14).ToSection().AddTable().AddColumnToTable()
                .AddColumnToTable()
                .AddRow().SetBold().AddCellToRow("Název").AddCellToRow("Link").ToTable();


            foreach (var urlMedia in activity.GetUrls())
            {
                linksTable.AddRow().AddCellToRow(urlMedia?.Name).AddCellToRow(urlMedia?.Path);
            }


            var images = linksTable.ToSection().AddParagraph("Obrázky").SetMarginTop(10).SetMarginBottom(10)
                .SetAlignment(HorizontalAlignment.Left).SetFontSize(14).ToSection().AddTable().AddColumnToTable()
                .AddColumnToTable()
                .AddRow().SetBold().AddCellToRow("Název").AddCellToRow("Link").ToTable();


            foreach (var imgMedia in activity.GetImages())
            {
                var path = _fileHandlingService.GetActivityFolder(activity.Name);

                FileInfo fi = new FileInfo(imgMedia!.Path);
                var imgFullPath = Path.Combine(path, fi.Name);

                images.AddRow().AddCellToRow(imgMedia?.Name).AddCell().AddImage(imgFullPath, ScalingMode.Stretch)
                    .SetKeepWithNext().ToTable();
            }




        }
    }
}
