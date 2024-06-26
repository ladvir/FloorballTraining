﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityMediaEFCoreFactory(IActivityMediaRepository repository) : IActivityMediaFactory
{
    public async Task<ActivityMedia> GetMergedOrBuild(ActivityMediaDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new ActivityMedia();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivityMedia entity, ActivityMediaDto dto)
    {
        await Task.Run(() =>
        {
            entity.Id = dto.Id;

            entity.MediaType = dto.MediaType;
            entity.Name = dto.Name;
            entity.Data = dto.Data;
            entity.Path = dto.Path;
            entity.Preview = dto.Preview;
            entity.ActivityId = entity.ActivityId;
        });



    }
}