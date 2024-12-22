using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.WebApp.Controls.Activities;

public interface IExportService<T> where T : BaseEntityDto
{
    Task ExportToPdf(int id, string name, string navigationManagerUri);
}



