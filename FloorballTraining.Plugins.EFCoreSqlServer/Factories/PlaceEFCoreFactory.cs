using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class PlaceEFCoreFactory(IPlaceRepository repository) : IPlaceFactory
{
    public async Task<Place> GetMergedOrBuild(PlaceDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new Place();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Place entity, PlaceDto dto)
    {
        await Task.Run(() =>
        {
            entity.Id = dto.Id;
            entity.Name = dto.Name;
            entity.Environment = (Environment)Enum.Parse(typeof(Environment), dto.Environment);
            entity.Width = dto.Width;
            entity.Length = dto.Length;
        });

    }
}