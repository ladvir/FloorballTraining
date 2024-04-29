using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsUseCase : IViewClubsUseCase
{
    private readonly IClubRepository _clubRepository;
    private readonly IMapper _mapper;

    public ViewClubsUseCase(
        IClubRepository clubRepository,
        IMapper mapper)
    {
        _clubRepository = clubRepository;
        _mapper = mapper;
    }

    public async Task<Pagination<ClubDto>> ExecuteAsync(ClubSpecificationParameters parameters)
    {
        var specification = new ClubsSpecification(parameters);

        var countSpecification = new ClubsForCountSpecification(parameters);

        var totalItems = await _clubRepository.CountAsync(countSpecification);

        var clubs = await _clubRepository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Club>, IReadOnlyList<ClubDto>>(clubs);

        return new Pagination<ClubDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}