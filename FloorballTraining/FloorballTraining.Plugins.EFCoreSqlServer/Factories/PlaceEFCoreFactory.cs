using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Environment = FloorballTraining.CoreBusiness.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class PlaceEFCoreFactory : IPlaceFactory
{
    private readonly IPlaceRepository _repository;

    public PlaceEFCoreFactory(IPlaceRepository repository)
    {
        _repository = repository;
    }

    public async Task<Place> GetMergedOrBuild(PlaceDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Place();

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