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

        private const int DefaultFontSize = 10;
        private StyleBuilder _mainStyle = StyleBuilder.New();
        private StyleBuilder _tableCellValueStyle = StyleBuilder.New();
        private StyleBuilder _paragraphHeaderStyle = StyleBuilder.New();
        private StyleBuilder _titleStyle = StyleBuilder.New();
        private StyleBuilder _tableCellHeaderStyle = StyleBuilder.New();
        private StyleBuilder _urlStyle = StyleBuilder.New();

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

            SetStyles();

            return CreatePdf(activity);
        }

        private void SetStyles()
        {
            _mainStyle = StyleBuilder.New()
                .SetFontName(FontNames.Times)
                .SetFontSize(DefaultFontSize)
                .SetFontEncodingName(EncodingNames.CP1250)
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

        private byte[] CreatePdf(Activity activity)
        {
            var document = DocumentBuilder.New().ApplyStyle(_mainStyle);

            GenerateContent(activity, document);

            using var stream = new MemoryStream();
            document.Build(stream);

            return stream.ToArray();
        }

        private void GenerateContent(Activity activity, DocumentBuilder document)
        {

            SetStyles();

            var content = document
                .AddSection().SetSize(PaperSize.A4).SetOrientation(PageOrientation.Portrait).ApplyStyle(_mainStyle)

                /*Title*/
                .AddParagraph(activity.Name).ApplyStyle(_titleStyle)
                .ToSection()

                /*Basic parameters*/
                .AddTable().SetBorder(Stroke.None)
                .AddColumnToTable().AddColumnToTable().AddColumnToTable().AddColumnToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow("Doba trvání")
                .AddCellToRow("Počet hráčů")
                .AddCellToRow("Věkové kategorie", 2)
                .ToTable()
                .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow($"{activity.DurationMin} - {activity.DurationMax}")
                .AddCellToRow($"{activity.PersonsMin} - {activity.PersonsMax}")
                .AddCellToRow(string.Join(", ", activity.GetAgeGroupNames()), 2)
                .ToTable()


                .AddRow().AddCellToRow(string.Empty, 4).ToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow("Pomůcky a vybavení", 2)
                .AddCellToRow("Štítky", 2).ToTable()
                .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow(string.Join(", ", activity.GetEquipmentNames()), 2)
                .AddCellToRow(string.Join(", ", activity.GetTagNames()), 2)
                .ToTable()


                /*Description*/
                .ToSection()
                .AddParagraph("Popis").ApplyStyle(_paragraphHeaderStyle)
                .ToSection()
                .AddParagraph(activity.Description).ApplyStyle(_mainStyle);


            AddImages(content.ToSection(), activity);
            AddUrls(content.ToSection(), activity);

        }

        private void AddUrls(SectionBuilder section, Activity activity)
        {
            var urls = activity.GetUrls();

            if (!urls.Any()) return;

            var linksTable = section.AddParagraph("Odkazy").ApplyStyle(_paragraphHeaderStyle).ToSection();

            foreach (var urlMedia in urls)
            {
                linksTable.AddParagraph().AddUrlToParagraph(urlMedia?.Path, urlMedia?.Path).ApplyStyle(_urlStyle);
            }
        }

        private void AddImages(SectionBuilder section, Activity activity)
        {
            var images = activity.GetImages();
            if (!images.Any()) return;

            var imagesTable = section.AddParagraph("Obrázky").ApplyStyle(_paragraphHeaderStyle).ToSection()

                 .AddTable()
                 .AddColumnToTable().AddColumnToTable()
                 .AddRow().AddCellToRow("Název").AddCellToRow("Link").ToTable();

            foreach (var imgMedia in images)
            {
                var path = _fileHandlingService.GetActivityFolder(activity.Name);

                var fi = new FileInfo(imgMedia!.Path);
                var imgFullPath = Path.Combine(path, fi.Name);

                imagesTable.AddRow().AddCellToRow(imgMedia.Name).AddCell().AddImage(imgFullPath, ScalingMode.Stretch)
                    .SetKeepWithNext().ToTable();
            }
        }
    }
}
