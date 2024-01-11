using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ActivityConverter
{
    public static ActivityDto? ToDto(this Activity? entity)
    {
        if (entity == null) return null;

        return new ActivityDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Environment = entity.Environment.ToString(),
            PersonsMin = entity.PersonsMin,
            PersonsMax = entity.PersonsMax,
            PlaceWidth = entity.PlaceWidth,
            PlaceLength = entity.PlaceLength,
            Difficulty = entity.Difficulty,
            Intensity = entity.Intensity,
            DurationMin = entity.DurationMin,
            DurationMax = entity.DurationMax,
            ActivityAgeGroups = entity.ActivityAgeGroups.Select(ageGroup => ageGroup.ToDto()!).ToList(),
            ActivityTags = entity.ActivityTags.Select(t => t.ToDto()!).ToList(),
            ActivityEquipments = entity.ActivityEquipments.Select(equipment => equipment.ToDto()!).ToList()
        };
    }
}