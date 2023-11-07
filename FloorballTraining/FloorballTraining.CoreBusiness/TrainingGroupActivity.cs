﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness;

public class TrainingGroupActivity
{
    [Key]
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int TrainingGroupActivityId { get; set; }

    public int TrainingGroupId { get; set; }

    public TrainingGroup? TrainingGroup { get; set; }

    public int ActivityId { get; set; }
    public Activity? Activity { get; set; }

    public TrainingGroupActivity Clone()
    {
        var tgActivity = new TrainingGroupActivity
        {
            TrainingGroupActivityId = TrainingGroupActivityId,
            TrainingGroupId = TrainingGroupId,
            ActivityId = Activity!.ActivityId,
            TrainingGroup = TrainingGroup
        };

        return tgActivity;
    }
}