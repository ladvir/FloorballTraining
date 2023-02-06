using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models;

[Table("TrainingParts")]
public class TrainingPart
{
    [Key]
    [Required]
    public int TrainingPartId { get; set; }

    public string Name { get; set; }

    public string Description { get; set; }

    public List<Activity> Activities { get; set; }


    public List<Training> Trainings { get; set; }

    public List<TrainingPartActivity> TrainingPartActivities { get; set; }
    public List<TrainingTrainingPart> TrainingTrainingParts { get; set; }
}