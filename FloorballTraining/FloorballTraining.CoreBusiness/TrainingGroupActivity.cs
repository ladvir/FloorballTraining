using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness;

public class TrainingGroupActivity
{
    [Key]
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int TrainingGroupId { get; set; }

    public TrainingGroup? TrainingGroup { get; set; }

    public int ActivityId { get; set; }
    public Activity? Activity { get; set; }

    public TrainingGroupActivity Clone()
    {
        var tgActivity = new TrainingGroupActivity
        {
            Id = Id,
            TrainingGroupId = TrainingGroupId,
            ActivityId = Activity!.Id,
            TrainingGroup = TrainingGroup
        };

        return tgActivity;
    }
}