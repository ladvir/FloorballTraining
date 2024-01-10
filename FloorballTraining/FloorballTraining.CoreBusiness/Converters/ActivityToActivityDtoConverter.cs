using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters
{
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
                ActivityAgeGroups = entity.ActivityAgeGroups.Select(ageGroup => ageGroup.AgeGroup!.ToDto()!).ToList(),
                ActivityTags = entity.ActivityTags.Select(t => t.ToDto()!).ToList(),
                ActivityEquipments = entity.ActivityEquipments.Select(equipment => equipment.Equipment!.ToDto()!).ToList()
            };
        }
    }

    public static class TrainingConverter
    {
        public static TrainingDto? ToDto(this Training? entity)
        {
            if (entity == null) return null;

            return new TrainingDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Place = entity.Place!.ToDto(),
                PersonsMin = entity.PersonsMin,
                PersonsMax = entity.PersonsMax,
                Difficulty = entity.Difficulty,
                Intensity = entity.Intensity,
                Duration = entity.Duration,
                CommentAfter = entity.CommentAfter,
                CommentBefore = entity.CommentBefore,
                TrainingParts = entity.TrainingParts != null ? entity.TrainingParts.Select(part => part.ToDto()!).ToList() : new List<TrainingPartDto>(),
                TrainingAgeGroups = entity.TrainingAgeGroups.Select(ageGroup => ageGroup.AgeGroup!.ToDto()!).ToList(),
                TrainingGoal = entity.TrainingGoal!.ToDto()
            };
        }
    }

    public static class AgeGroupToAgeGroupDtoConverter
    {
        public static AgeGroupDto? ToDto(this AgeGroup? entity)
        {
            if (entity == null) return null;

            return new AgeGroupDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description
            };
        }
    }
    public static class EquipmentConverter
    {
        public static EquipmentDto? ToDto(this Equipment? entity)
        {
            if (entity == null) return null;
            return new EquipmentDto
            {
                Id = entity.Id,
                Name = entity.Name
            };
        }
    }

    public static class TagConverter
    {
        public static TagDto? ToDto(this Tag? entity)
        {
            if (entity == null) return null;

            return new TagDto
            {
                Id = entity.Id,
                Name = entity.Name,
                ParentTagName = entity.ParentTag?.Name,
                IsTrainingGoal = entity.IsTrainingGoal,
                ParentTagId = entity.ParentTagId,
                Color = entity.Color
            };
        }
    }


    public static class ActivityTagConverter
    {
        public static ActivityTagDto? ToDto(this ActivityTag? entity)
        {
            if (entity == null) return null;

            return new ActivityTagDto
            {
                Id = entity.Id,
                Tag = entity.Tag.ToDto(),
                TagId = entity.Tag?.Id,
                Activity = entity.Activity.ToDto(),
                ActivityId = entity.ActivityId
            };
        }
    }


    public static class TrainingPartConverter
    {
        public static TrainingPartDto? ToDto(this TrainingPart? entity)
        {
            if (entity == null) return null;



            return new TrainingPartDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Duration = entity.Duration,
                Order = entity.Order,
                TrainingGroups = entity.TrainingGroups.Select(tg => tg.ToDto()!).ToList()
            };
        }
    }

    public static class TrainingGroupConverter
    {
        public static TrainingGroupDto? ToDto(this TrainingGroup? entity)
        {
            if (entity == null) return null;

            return new TrainingGroupDto
            {
                Id = entity.Id,
                PersonsMax = entity.PersonsMax,
                PersonsMin = entity.PersonsMin,
                Activity = entity.Activity.ToDto()
            };
        }
    }

    public static class PlaceConverter
    {
        public static PlaceDto? ToDto(this Place? entity)
        {
            if (entity == null) return null;

            return new PlaceDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Environment = entity.Environment.ToString(),
                Length = entity.Length,
                Width = entity.Width
            };
        }
    }
}