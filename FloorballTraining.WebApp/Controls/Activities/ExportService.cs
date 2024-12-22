using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases;
using Microsoft.JSInterop;

namespace FloorballTraining.WebApp.Controls.Activities;

public class ExportService<T>(
    ICreatePdfUseCase<T> createPdfUseCase,
    IJSRuntime jsRuntime) : IExportService<T> where T : BaseEntityDto
{
    public async Task ExportToPdf(int id, string name, string uri)
    {
        var pdf = await createPdfUseCase.ExecuteAsync(id, uri);
        await DownloadPdf(name, pdf);
    }

    private async Task DownloadPdf(string name, byte[]? content)
    {
        var fileName = name.Replace(" ", "") + ".pdf";
        fileName = Path.GetInvalidFileNameChars().Aggregate(fileName, (current, c) => current.Replace(c, '_'));
        await jsRuntime.InvokeVoidAsync("saveFileAsPdf", fileName, content);
    }
}