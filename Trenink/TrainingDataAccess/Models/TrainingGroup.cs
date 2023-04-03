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


    public int TrainingPartId { get; set; }

    public TrainingPart TrainingPart { get; set; } = null!;



    public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new List<TrainingGroupActivity>();

    public TrainingGroup()
    {

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


    public void Initialize(int trainingGroupId, string? name)
    {
        TrainingGroupId = trainingGroupId;
        Name = name;
    }
    public void Initialize(TrainingPart trainingPart, int trainingGroupId, string? name)
    {
        TrainingPart = trainingPart;
        TrainingPartId = trainingPart.TrainingPartId;
        TrainingGroupId = trainingGroupId;
        Name = name;
    }



    public void AddTrainingGroupActivity(TrainingGroupActivity activity)
    {
        if (!TrainingGroupActivities.Contains(activity)) TrainingGroupActivities.Add(activity);
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

        //predicate = predicate.Or(tp => tp.Activities.Any(a => a.ContainsString(keywords)));

        return predicate;
    }
}