using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubByIdUseCase : IViewClubByIdUseCase
{
    private readonly IClubRepository _clubRepository;
    private readonly IMapper _mapper;

    public ViewClubByIdUseCase(IClubRepository clubRepository, IMapper mapper)
    {
        _clubRepository = clubRepository;
        _mapper = mapper;
    }

    public async Task<ClubDto> ExecuteAsync(int clubId)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);

        return _mapper.Map<Club?, ClubDto>(club);


    }
}