using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.PluginInterfaces.Factories;

public interface IActivityTagFactory : IGenericFactory<ActivityTag, ActivityTagDto>
{
}

public interface IActivityAgeGroupFactory : IGenericFactory<ActivityAgeGroup, ActivityAgeGroupDto>
{
}