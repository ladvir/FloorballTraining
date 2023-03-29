using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;
using TrainingDataAccess.Services.ActivityServices;

namespace TrainingDataAccess.Models;

[Table("TrainingGroups")]
public class TrainingGroup
{
    [Key]
    [Required]
    public int TrainingGroupId { get; private set; }

    public string? Name { get; private set; } = string.Empty;

    public List<Activity> Activities { get; set; } = new List<Activity>();


    public int TrainingPartId { get; set; }

    public TrainingPart TrainingPart { get; set; } = null!;



    public List<TrainingGroupActivity> TrainingGroupActivities = new List<TrainingGroupActivity>();

    public TrainingGroup()
    {

    }

    public TrainingGroup(TrainingPart trainingPart)
    {
        TrainingPart = trainingPart;
    }
    public static TrainingGroup Create(int trainingPartId, int trainingGroupId, string? name)
    {
        var trainingGroup = new TrainingGroup
        {
            TrainingPartId = trainingPartId
        };

        trainingGroup.Initialize(trainingGroupId, name);

        return trainingGroup;
    }

    public static TrainingGroup Create(int trainingPartId, string? name)
    {
        var trainingGroup = new TrainingGroup();

        trainingGroup.Initialize(trainingPartId, name);

        return trainingGroup;
    }

    public static TrainingPart Create(Training training, int trainingPartId, string? name, string? description, int duration, int order)
    {
        var trainingPart = new TrainingPart(training);

        trainingPart.Initialize(trainingPartId, name, description, duration, order);

        return trainingPart;
    }
    public void Initialize(int trainingPartId, string? name)
    {
        TrainingPartId = trainingPartId;
        Name = name;
    }
    public void Initialize(int trainingPartId, int trainingGroupId, string? name)
    {
        TrainingPartId = trainingPartId;
        TrainingGroupId = trainingGroupId;
        Name = name;
    }

    public void AddActivites(List<Activity> activities)
    {
        foreach (var activity in activities)
        {
            if (!Activities.Contains(activity)) Activities.Add(activity);
        }

    }

    public void AddActivity(Activity activity)
    {
        if (!Activities.Contains(activity)) Activities.Add(activity);
    }
    public void RemoveActivity(Activity activity)
    {
        if (Activities.Contains(activity)) Activities.Remove(activity);
    }

    public static Expression<Func<TrainingGroup, bool>> Contains(
        params string[] keywords)
    {
        var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();

        var predicate = keywordsList.Any() ? PredicateBuilder.False<TrainingGroup>() : PredicateBuilder.True<TrainingGroup>();

        foreach (var keyword in keywordsList)
        {
            predicate = predicate.Or(tp => !string.IsNullOrEmpty(tp.Name) && tp.Name.Contains(keyword));

        }

        predicate = predicate.Or(tp => tp.Activities.Any(a => a.ContainsString(keywords)));

        return predicate;
    }
}