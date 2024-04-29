﻿using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TeamConverter
{
    public static TeamDto ToDto(this Team entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new TeamDto
        {
            Id = entity.Id,
            Name = entity.Name,
            AgeGroup = entity.AgeGroup!.ToDto(),
            TeamMembers = entity.TeamMembers.Any() ? entity.TeamMembers.Select(tm => tm.ToDto()).ToList() : new List<TeamMemberDto>(),
            TeamTrainings = entity.TeamTrainings.Any() ? entity.TeamTrainings.Select(t => t.ToDto()).ToList() : new List<TeamTrainingDto>(),

        };
    }
}