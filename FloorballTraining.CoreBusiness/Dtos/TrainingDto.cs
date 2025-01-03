﻿namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public int Duration { get; set; }

    public int PersonsMin { get; set; }
    public int PersonsMax { get; set; }

    public int GoaliesMin { get; set; }
    public int GoaliesMax { get; set; }

    public int Intensity { get; set; }

    public int Difficulty { get; set; }


    public string? CommentBefore { get; set; } = string.Empty;
    public string? CommentAfter { get; set; } = string.Empty;


    public PlaceDto? Place { get; set; }

    public TagDto? TrainingGoal1 { get; set; }

    public TagDto? TrainingGoal3 { get; set; }
    public TagDto? TrainingGoal2 { get; set; }

    public List<AgeGroupDto> TrainingAgeGroups { get; set; } = [];
    public List<TrainingPartDto> TrainingParts { get; set; } = [];


    public List<string> GetEquipment()
    {
        var x = TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)
            .Select(a => a.Activity);

        var z = x.Where(a => a != null && a.ActivityEquipments.Any()).AsEnumerable().SelectMany(a => a!.ActivityEquipments);

        var set = new HashSet<string>();

        return z.Select(ae => ae.Equipment!.Name).Where(s => set.Add(s)).ToList();
    }

    public int GetActivitiesDuration()
    {
        return TrainingParts.Sum(t => t.Duration);
    }

    public int GetTrainingGoalActivitiesDuration()
    {
        if (TrainingParts.Sum(tp => tp.TrainingGroups?.Count) == 0) return 0;


        var trainingPartsWithTrainingGoal = TrainingParts.Where(t => t.TrainingGroups != null).Where(tp =>
            tp.TrainingGroups!.Any(tga =>
                tga.Activity != null && tga.Activity.ActivityTags.Any(tag =>
                    tag.TagId == TrainingGoal1?.Id || tag.TagId == TrainingGoal2?.Id || tag.TagId == TrainingGoal3?.Id))).Sum(tp => tp.Duration);

        return trainingPartsWithTrainingGoal;
    }

    public void AddAgeGroup(AgeGroupDto ageGroup)
    {
        if (TrainingAgeGroups.All(at => at != ageGroup))
        {
            TrainingAgeGroups.Add(ageGroup);
        }
    }

    public List<string> GetAgeGroupNames()
    {
        var names = TrainingAgeGroups.Select(ae => ae.Description).OrderBy(d => d).ToList();

        if (names.Count == 0)
        {
            names.Add(AgeGroup.AnyAge);
        }

        return names;
    }

    public List<ActivityDto?> GetActivities()
    {
        return TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)

            .Select(tga => tga.Activity).ToList();
    }

    public List<string> GetActivityNames()
    {
        return TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)
            .Where(tga => tga.Activity != null)
            .Select(tga => tga.Activity!.Name).ToList();
    }

    public void AddTrainingPart(TrainingPartDto trainingPart)
    {
        TrainingParts.Add(trainingPart);
    }

    public void AddTrainingPart()
    {
        AddTrainingPart(
            new TrainingPartDto
            {
                Name = $"{TrainingParts.Count + 1}",
                Order = TrainingParts.Count != 0 ? TrainingParts.Max(tp => tp.Order) : 0 + 1,
                TrainingGroups =
                [
                    new TrainingGroupDto
                    {
                        PersonsMax = PersonsMax
                    }
                ]
            });
    }

    public List<TagDto> GetTrainingGoals()
    {
        var goals = new List<TagDto>();

        if (TrainingGoal1 != null) goals.Add(TrainingGoal1);
        if (TrainingGoal2 != null) goals.Add(TrainingGoal2);
        if (TrainingGoal3 != null) goals.Add(TrainingGoal3);
        return goals;
    }

    public string GetTrainingGoalsAsString(string separator = ", ")
    {
        return string.Join(separator, GetTrainingGoals().Select(g => g.Name));
    }

    public string GetAgeGroupNamesAsString(string separator=", " )
    {
         return string.Join(separator, GetAgeGroupNames());
        
    }
}