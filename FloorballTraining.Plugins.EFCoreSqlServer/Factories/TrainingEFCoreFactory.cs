﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingEFCoreFactory : ITrainingFactory
{
    private readonly ITrainingRepository _repository;
    private readonly IPlaceRepository _placeRepository;
    private readonly ITagFactory _tagFactory;
    private readonly IAgeGroupFactory _ageGroupFactory;
    private readonly ITrainingPartFactory _trainingPartFactory;

    public TrainingEFCoreFactory(
        ITrainingRepository repository,
        IPlaceRepository placeRepository,
        ITagFactory tagFactory,
        IAgeGroupFactory ageGroupFactory,
        ITrainingPartFactory trainingPartFactory)
    {
        _repository = repository;
        _placeRepository = placeRepository;
        _tagFactory = tagFactory;
        _ageGroupFactory = ageGroupFactory;
        _trainingPartFactory = trainingPartFactory;
    }

    public async Task<Training> GetMergedOrBuild(TrainingDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Training();

        if (dto.Place != null)
        {
            var place = await _placeRepository.GetByIdAsync(dto.Place.Id);

            entity.Place = place;
            entity.PlaceId = place!.Id;
        }

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Training entity, TrainingDto dto)
    {
        entity.Id = dto.Id;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Difficulty = dto.Difficulty;
        entity.Duration = dto.Duration;
        entity.CommentAfter = dto.CommentAfter;
        entity.CommentBefore = dto.CommentBefore;
        entity.PersonsMin = dto.PersonsMin;
        entity.PersonsMax = dto.PersonsMax;

        entity.TrainingGoal1 = await _tagFactory.GetMergedOrBuild(dto.TrainingGoal1!);
        entity.TrainingGoal2 = await _tagFactory.GetMergedOrBuild(dto.TrainingGoal2!);
        entity.TrainingGoal3 = await _tagFactory.GetMergedOrBuild(dto.TrainingGoal3!);

        entity.TrainingGoal1Id = dto.TrainingGoal1?.Id;
        entity.TrainingGoal2Id = dto.TrainingGoal2?.Id;
        entity.TrainingGoal3Id = dto.TrainingGoal3?.Id;


        await TrainingAgeGroupsMergeOrBuild(entity, dto);

        await TrainingPartsMergeOrBuild(entity, dto);

    }
    private async Task TrainingAgeGroupsMergeOrBuild(Training entity, TrainingDto dto)
    {
        var trainingAgeGroups = new List<TrainingAgeGroup>();

        if (dto.TrainingAgeGroups != null)


            foreach (var trainingAgeGroupDto in dto.TrainingAgeGroups)
            {
                var ageGroup = await _ageGroupFactory.GetMergedOrBuild(trainingAgeGroupDto);

                var trainingAgeGroup = new TrainingAgeGroup
                {
                    //Id = trainingAgeGroupDto.Id,
                    //Training = entity,
                    TrainingId = entity.Id,
                    AgeGroup = ageGroup,
                    AgeGroupId = ageGroup.Id
                };

                trainingAgeGroups.Add(trainingAgeGroup);
            }

        entity.TrainingAgeGroups = trainingAgeGroups;
    }

    private async Task TrainingPartsMergeOrBuild(Training entity, TrainingDto dto)
    {
        if (dto.TrainingParts == null) return;

        entity.TrainingParts ??= new List<TrainingPart>();

        foreach (var trainingPart in dto.TrainingParts.Select(async trainingPartDto => await _trainingPartFactory.GetMergedOrBuild(trainingPartDto)))
        {
            entity.TrainingParts.Add(await trainingPart);
        }


    }
}