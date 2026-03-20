using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TeamConverter
{
    public static TeamDto? ToDto(this Team? entity)
    {
        if (entity == null) return null;

        return new TeamDto
        {
            Id = entity.Id,
            Name = entity.Name,
            AgeGroup = entity.AgeGroup!.ToDto(),
            AgeGroupId = entity.AgeGroup?.Id ?? entity.AgeGroupId,
            Club = entity.Club!.ToDto(),
            ClubId = entity.ClubId,
            PersonsMin = entity.PersonsMin,
            PersonsMax = entity.PersonsMax,
            DefaultTrainingDuration = entity.DefaultTrainingDuration,
            MaxTrainingDuration = entity.MaxTrainingDuration,
            MaxTrainingPartDuration = entity.MaxTrainingPartDuration,
            MinPartsDurationPercent = entity.MinPartsDurationPercent,
            ICalUrl = entity.ICalUrl,
            TeamMembers = entity.TeamMembers.Count != 0 ? entity.TeamMembers.Select(tm => tm.ToDto()).ToList() : [],
            Appointments = entity.Appointments.Count != 0 ? entity.Appointments.Select(t => t.ToDto()).ToList() : []
        };
    }
}
