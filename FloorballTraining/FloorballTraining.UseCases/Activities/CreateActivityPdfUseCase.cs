using FloorballTraining.CoreBusiness;
using FloorballTraining.Extensions;
using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using Gehtsoft.PDFFlow.Builder;
using Gehtsoft.PDFFlow.Models.Enumerations;
using Gehtsoft.PDFFlow.Models.Shared;
using System.Text;

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

            byte[]? result = null;

            SetStyles();
            try
            {
                result = await CreatePdf(activityId);
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

        private async Task<byte[]> CreatePdf(int activityId)
        {
            var activity = await _activityRepository.GetActivityByIdAsync(activityId);

            if (activity == null) throw new Exception("Aktivita nenalezena");


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
                .AddCellToRow(Encode("Doba trvání"))
                .AddCellToRow(Encode("Počet hráčů"))
                .AddCellToRow(Encode("Věkové kategorie"), 2)
                .ToTable()
                .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow(StringExtensions.GetRangeString(activity.DurationMin, activity.DurationMax))
                .AddCellToRow(StringExtensions.GetRangeString(activity.PersonsMin, activity.PersonsMax))
                .AddCellToRow(string.Join(", ", activity.GetAgeGroupNames()), 2)
                .ToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow(Encode("Obtížnost"), 2)
                .AddCellToRow(Encode("Intenzita"), 2)
                .ToTable()
                .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow($"{Difficulties.Values.Single(v => v.Value == activity.Difficulty).Description}", 2)
                .AddCellToRow($"{Intensities.Values.Single(v => v.Value == activity.Intesity).Description}", 2)
                .ToTable()



                .AddRow().AddCellToRow(string.Empty, 4).ToTable()
                .AddRow().ApplyStyle(_tableCellHeaderStyle)
                .AddCellToRow(Encode("Pomůcky a vybavení"), 2)
                .AddCellToRow(Encode("Štítky"), 2).ToTable()
                .AddRow().ApplyStyle(_tableCellValueStyle)
                .AddCellToRow(string.Join(", ", activity.GetEquipmentNames()), 2)
                .AddCellToRow(string.Join(", ", activity.GetTagNames()), 2)
                .ToTable()


                /*Description*/
                .ToSection()
                .AddParagraph("Popis").ApplyStyle(_paragraphHeaderStyle)
                .ToSection()
                .AddParagraph(activity.Description).ApplyStyle(_mainStyle);





            AddImages(content.ToSection(), activity.GetImages(), activity.Name);
            AddUrls(content.ToSection(), activity.GetUrls());

            //TestEncoding(content.ToSection(), activity);

        }

        private string Encode(string text)
        {
            return Encoding.UTF8.GetString(Encoding.Default.GetBytes(text));
        }

        private void AddUrls(SectionBuilder section, List<ActivityMedia> urls)
        {
            if (!urls.Any()) return;

            var linksTable = section.AddParagraph("Odkazy").ApplyStyle(_paragraphHeaderStyle).ToSection();

            foreach (var urlMedia in urls)
            {
                linksTable.AddParagraph().AddUrlToParagraph(urlMedia.Path, urlMedia.Path).ApplyStyle(_urlStyle);
            }
        }

        private void AddImages(SectionBuilder section, List<ActivityMedia> images, string activityName)
        {

            if (!images.Any()) return;

            var imagesTable = section.AddParagraph(Encode("Obrázky")).ApplyStyle(_paragraphHeaderStyle).ToSection()

                .AddTable()
                .AddColumnToTable();


            foreach (var imgMedia in images)
            {

                if (!string.IsNullOrEmpty(imgMedia.Path))
                {
                    var path = _fileHandlingService.GetActivityFolder2(activityName);

                    var fi = new FileInfo(imgMedia.Path);
                    var imgFullPath = Path.Combine(path, fi.Name);


                    imagesTable.AddRow().AddCell()
                        .AddImage(imgFullPath).SetMarginTop(7f)
                        .SetKeepWithNext().ToTable();

                }
                else if (!string.IsNullOrEmpty(imgMedia.Preview))
                {

                    var image = ConvertToByteArray(imgMedia.Preview);

                    imagesTable.AddRow().AddCell(imgMedia.Name)
                        .AddImage(image, ScalingMode.Stretch)
                        .SetKeepWithNext().ToTable();
                }
            }
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
