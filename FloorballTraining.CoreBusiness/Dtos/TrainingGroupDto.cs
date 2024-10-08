﻿namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingGroupDto : BaseEntityDto
{
    public int PersonsMax { get; set; }

    public int PersonsMin { get; set; } = 1;

    public int GoaliesMin { get; set; }
    public int GoaliesMax { get; set; }

    public ActivityDto? Activity { get; set; }
}