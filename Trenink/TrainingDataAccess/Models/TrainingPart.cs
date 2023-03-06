using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models;

[Table("TrainingParts")]
public class TrainingPart
{
    [Key]
    [Required]
    public int TrainingPartId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public List<Activity> Activities { get; set; } = new List<Activity>();

    public List<Training> Trainings { get; set; } = new List<Training>();

    public List<TrainingPartActivity> TrainingPartActivities { get; set; } = new List<TrainingPartActivity>();

    public List<TrainingTrainingPart> TrainingTrainingParts { get; set; } = new List<TrainingTrainingPart>();


    [NotMapped]
    public int TrainingPartType { get; set; }


    public TrainingPart()
    {
    }

    public TrainingPart(string name)
    {
        Name = name;
    }



}