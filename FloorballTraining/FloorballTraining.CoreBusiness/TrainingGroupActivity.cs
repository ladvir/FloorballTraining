using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness;

public class TrainingGroupActivity
{
    [Key]
    [Required]
    public int TrainingGroupActivityId { get; set; }

    public int TrainingGroupId { get; set; }

    public TrainingGroup? TrainingGroup { get; set; }

    public int ActivityId { get; set; }
    public Activity? Activity { get; set; }

    public int Duration { get; set; }
}