﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingPartEFCoreFactory(ITrainingPartRepository repository, ITrainingGroupFactory trainingGroupFactory)
    : ITrainingPartFactory
{
    public async Task<TrainingPart> GetMergedOrBuild(TrainingPartDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id);



        if (entity == null)
        {
            entity = new TrainingPart();
        }

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(TrainingPart entity, TrainingPartDto dto)
    {

        entity.Id = dto.Id;
        entity.Description = dto.Description;
        entity.Name = dto.Name;
        entity.Duration = dto.Duration;
        entity.Order = dto.Order;


        if (dto.TrainingGroups == null) return;


        foreach (var trainingGroup in dto.TrainingGroups.Select(async trainingGroupDto => await trainingGroupFactory.GetMergedOrBuild(trainingGroupDto).ConfigureAwait(true)))
        {
            if (trainingGroup != null)
            {
                entity.TrainingGroups ??= new List<TrainingGroup>();


                entity.TrainingGroups.Add(await trainingGroup);
            }
        }


    }
}