namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public int Duration { get; set; }

    public int PersonsMin { get; set; }
    public int PersonsMax { get; set; }

    public int Intensity { get; set; }

    public int Difficulty { get; set; }


    public string? CommentBefore { get; set; } = string.Empty;
    public string? CommentAfter { get; set; } = string.Empty;


    public PlaceDto? Place { get; set; } = null!;

    public TagDto? TrainingGoal { get; set; } = null!;

    public List<AgeGroupDto>? TrainingAgeGroups { get; set; }
    public List<TrainingPartDto>? TrainingParts { get; set; }


    public List<string> GetEquipment()
    {
        if (TrainingParts == null) return new List<string>();

        var x = TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)
            .Select(a => a.Activity);

        var z = x.Where(a => a != null && a.ActivityEquipments.Any()).AsEnumerable().SelectMany(a => a!.ActivityEquipments);

        var set = new HashSet<string>();

        return z.Select(ae => ae.Equipment!.Name).Where(s => set.Add(s)).ToList();
    }

    public int GetActivitiesDuration()
    {
        return TrainingParts?.Sum(t => t.Duration) ?? 0;
    }

    public int GetTrainingGoalActivitiesDuration()
    {
        if (TrainingParts == null || TrainingParts != null && TrainingParts.Sum(tp => tp.TrainingGroups?.Count) == 0) return 0;


        var trainingPartsWithTrainingGoal = TrainingParts!.Where(t => t.TrainingGroups != null).Where(tp =>
            tp.TrainingGroups!.Any(tga =>
                tga.Activity != null && tga.Activity.ActivityTags.Any(tag =>
                    tag.Id == TrainingGoal?.Id))).Sum(tp => tp.Duration);

        return trainingPartsWithTrainingGoal;
    }

    public void AddAgeGroup(AgeGroupDto ageGroup)
    {
        TrainingAgeGroups ??= new List<AgeGroupDto>();

        if (TrainingAgeGroups.All(at => at != ageGroup))
        {
            TrainingAgeGroups.Add(ageGroup);
        }
    }

    public List<string> GetAgeGroupNames()
    {
        var names = TrainingAgeGroups?.Select(ae => ae.Description).OrderBy(d => d).ToList() ?? new List<string>();

        if (!names.Any())
        {
            names.Add(AgeGroup.AnyAge);
        }

        return names;
    }

    public List<ActivityDto?> GetActivities()
    {
        if (TrainingParts == null) return new List<ActivityDto?>();

        return TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)

            .Select(tga => tga.Activity).ToList();
    }

    public List<string> GetActivityNames()
    {
        if (TrainingParts == null) return new List<string>();

        return TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)
            .Where(tga => tga.Activity != null)
            .Select(tga => tga.Activity!.Name).ToList();
    }

    public void AddTrainingPart(TrainingPartDto trainingPart)
    {
        TrainingParts ??= new List<TrainingPartDto>();

        TrainingParts.Add(trainingPart);
    }

    public void AddTrainingPart()
    {
        AddTrainingPart(
            new TrainingPartDto
            {
                Name = $"{TrainingParts?.Count + 1}",
                Order = TrainingParts != null && TrainingParts.Any() ? TrainingParts.Max(tp => tp.Order) : 0 + 1,
                TrainingGroups = new List<TrainingGroupDto>
                {
                    new()
                    {
                        PersonsMax = PersonsMax
                    }
                }
            });
    }
}