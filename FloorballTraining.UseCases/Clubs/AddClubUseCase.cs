﻿using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Clubs
{
    public class AddClubUseCase : IAddClubUseCase
    {
        private readonly IClubRepository _clubRepository;
        private readonly IClubFactory _clubFactory;

        public AddClubUseCase(IClubRepository clubRepository, IClubFactory clubFactory)
        {
            _clubRepository = clubRepository;
            _clubFactory = clubFactory;
        }

        public async Task ExecuteAsync(ClubDto clubDto)
        {
            var club = await _clubFactory.GetMergedOrBuild(clubDto);
            await _clubRepository.AddClubAsync(club);
        }
    }
}