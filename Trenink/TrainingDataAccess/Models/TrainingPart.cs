/*using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models;

[Table("TrainingParts")]
public class TrainingPart
{
    [Key]
    [Required]
    public int TrainingPartId { get; private set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public List<Activity> Activities { get; set; } = new List<Activity>();

    public Training Training { get; set; } = null!;

    public List<TrainingPartActivity> TrainingPartActivities { get; set; } = new List<TrainingPartActivity>();


    [NotMapped]
    public int TrainingPartType { get; set; }


    public TrainingPart()
    {
    }

    public TrainingPart(string name)
    {
        Name = name;
    }






}*/