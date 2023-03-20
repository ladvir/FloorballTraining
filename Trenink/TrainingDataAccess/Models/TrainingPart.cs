using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;
using TrainingDataAccess.Services.ActivityServices;

namespace TrainingDataAccess.Models;

[Table("TrainingParts")]
public class TrainingPart
{
    [Key]
    [Required]
    public int TrainingPartId { get; private set; }

    public string? Name { get; private set; } = string.Empty;

    public string? Description { get; private set; } = string.Empty;

    public int Duration { get; private set; }


    public int TrainingId { get; set; }

    public Training Training { get; set; } = null!;

    //public List<TrainingGroup> TrainingGroups { get; set; } = new List<TrainingGroup>();


    public int Order { get; private set; }
    public TrainingPart()
    {

    }

    public TrainingPart(Training training)
    {
        Training = training;
    }
    public static TrainingPart Create(int trainingId, int trainingPartId, string? name, string? description, int duration, int order)
    {
        var trainingPart = new TrainingPart
        {
            TrainingId = trainingId
        };

        trainingPart.Initialize(trainingPartId, name, description, duration, order);

        return trainingPart;
    }

    public static TrainingPart Create(int trainingPartId, string? name, string? description, int duration, int order)
    {
        var trainingPart = new TrainingPart();

        trainingPart.Initialize(trainingPartId, name, description, duration, order);

        return trainingPart;
    }

    public static TrainingPart Create(Training training, int trainingPartId, string? name, string? description, int duration, int order)
    {
        var trainingPart = new TrainingPart(training);

        trainingPart.Initialize(trainingPartId, name, description, duration, order);

        return trainingPart;
    }

    public void Initialize(int trainingPartId, string? name, string? description, int duration, int order)
    {
        TrainingPartId = trainingPartId;
        Name = name;
        Description = description;
        Duration = duration;
        Order = order;
    }

    public static Expression<Func<TrainingPart, bool>> Contains(
        params string[] keywords)
    {
        var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();

        var predicate = keywordsList.Any() ? PredicateBuilder.False<TrainingPart>() : PredicateBuilder.True<TrainingPart>();

        foreach (var keyword in keywordsList)
        {
            predicate = predicate.Or(tp => !string.IsNullOrEmpty(tp.Name) && tp.Name.Contains(keyword));
            predicate = predicate.Or(tp => !string.IsNullOrEmpty(tp.Description) && tp.Description.Contains(keyword));
            //predicate = predicate.Or(tp => tp.TrainingGroups.Any(t => t.Contains(keyword)));
        }

        return predicate;
    }
}