using System.ComponentModel.DataAnnotations.Schema;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness.Dtos;

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

    public Environment Environment { get; set; } = Environment.Anywhere;

    public List<TrainingTagDto> TrainingTags { get; set; } = [];

    public bool NoSpecificGoal { get; set; }

    public SkillDto? TrainingGoalSkill1 { get; set; }
    public SkillDto? TrainingGoalSkill2 { get; set; }
    public SkillDto? TrainingGoalSkill3 { get; set; }

    public bool IsDraft { get; set; } = true;

    public bool IsIndividual { get; set; }

    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Server-computed for the calling user (read endpoints only) — mirrors CanModifyTrainingAsync.</summary>
    public bool CanEdit { get; set; }

    public string? ActivitySignature { get; set; }

    [NotMapped]
    public List<string> ValidationErrors { get; set; } = [];

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

    /// <summary>Minutes of training parts whose activities carry one of the 3 goal skills
    /// (#163) — the validated "does this training's content match its stated focus" check.</summary>
    public int GetGoalSkillActivitiesDuration()
    {
        if (TrainingParts.Sum(tp => tp.TrainingGroups?.Count) == 0) return 0;

        return TrainingParts.Where(t => t.TrainingGroups != null).Where(tp =>
            tp.TrainingGroups!.Any(tga =>
                tga.Activity != null && tga.Activity.ActivitySkills.Any(s =>
                    s.SkillId == TrainingGoalSkill1?.Id || s.SkillId == TrainingGoalSkill2?.Id || s.SkillId == TrainingGoalSkill3?.Id))).Sum(tp => tp.Duration);
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

    /// <summary>Skills this training develops, aggregated from its activities' ActivitySkills (#171).</summary>
    public List<string?> GetSkillNames()
    {
        return TrainingParts.Where(t => t.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)
            .Where(tga => tga.Activity != null)
            .SelectMany(tga => tga.Activity!.ActivitySkills)
            .Select(ase => ase.SkillName)
            .Distinct().ToList();
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
        return TrainingTags.Where(tt => tt.Tag != null).Select(tt => tt.Tag!).ToList();
    }

    public string GetTrainingGoalsAsString(string separator = ", ")
    {
        return string.Join(separator, GetTrainingGoals().Select(g => g.Name));
    }

    public void AddTag(TagDto tag)
    {
        if (TrainingTags.All(tt => tt.TagId != tag.Id))
        {
            TrainingTags.Add(new TrainingTagDto { TagId = tag.Id, Tag = tag });
        }
    }

    public List<SkillDto> GetGoalSkills()
    {
        var goals = new List<SkillDto>();

        if (TrainingGoalSkill1 != null) goals.Add(TrainingGoalSkill1);
        if (TrainingGoalSkill2 != null) goals.Add(TrainingGoalSkill2);
        if (TrainingGoalSkill3 != null) goals.Add(TrainingGoalSkill3);
        return goals.DistinctBy(g => g.Id).ToList();
    }

    public string GetGoalSkillsAsString(string separator = ", ")
    {
        return string.Join(separator, GetGoalSkills().Select(g => g.Name));
    }

    public string GetAgeGroupNamesAsString(string separator=", " )
    {
         return string.Join(separator, GetAgeGroupNames());
        
    }
}