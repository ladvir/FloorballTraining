using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsUseCase(
    IClubRepository clubRepository,
    IMapper mapper) : IViewClubsUseCase
{
    public async Task<Pagination<ClubDto>> ExecuteAsync(ClubSpecificationParameters parameters)
    {
        var specification = new ClubsSpecification(parameters);

        var countSpecification = new ClubsForCountSpecification(parameters);

        var totalItems = await clubRepository.CountAsync(countSpecification);

        var clubs = await clubRepository.GetListAsync(specification);

        var data = mapper.Map<IReadOnlyList<Club>, IReadOnlyList<ClubDto>>(clubs);

        return new Pagination<ClubDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}