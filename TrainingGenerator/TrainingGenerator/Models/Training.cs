﻿using Microsoft.EntityFrameworkCore.Infrastructure;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace TrainingGenerator.Models
{
    [Table("Training")]
    public class Training
    {
        [Key]
        public int TrainingId { get; set; }

        public string Name { get; set; }
        public int Duration { get; set; }
        public int PersonsMin { get; set; }
        public int PersonsMax { get; set; }
        public int FlorbalPercent { get; set; }
        [Required(AllowEmptyStrings = true)]
        public string Note { get; set; }
        public int BeginTimeMax { get; set; }
        public int WarmUpTimeMax { get; set; }
        public int WarmUpExcerciseTimeMax { get; set; }
        public int DrilTimeMax { get; set; }
        public int StretchingTimeMax { get; set; }
        public int EndTimeMax { get; set; }
        public int BlockPauseTimeMax { get; set; }
        public int ActivityPauseTimeMax { get; set; }
        public bool IsGameSituation1x1 { get; set; }
        public bool IsGameSituation2x2 { get; set; }
        public bool IsGameSituation3x3 { get; set; }
        public bool IsGameSituation4x4 { get; set; }
        public bool IsGameSituation5x5 { get; set; }
        public bool IsGameSituation2x3 { get; set; }
        public bool IsGameSituation2x1 { get; set; }
        public bool IsForGoalman { get; set; }
        public bool IsForForward { get; set; }
        public bool IsForDefender { get; set; }
        public bool IsTrainingPartWarmUp { get; set; }
        public bool IsTrainingWarmUpExcercise { get; set; }
        public bool IsTrainingPartDril { get; set; }
        public bool IsTrainingPartStretching { get; set; }
        public bool IsGame { get; set; }
        public bool IsFlorbal { get; set; }
        public bool IsTest { get; set; }
        public bool IsRelay { get; set; }
        public bool IsShooting { get; set; }
        public bool IsPass { get; set; }
        public bool IsBallLeading { get; set; }
        public bool IsFlexibility { get; set; }
        public bool IsStrength { get; set; }
        public bool IsDynamic { get; set; }
        public bool IsReleasing { get; set; }
        public bool IsSpeed { get; set; }
        public bool IsPersistence { get; set; }
        public bool IsThinking { get; set; }
        public bool IsTeamWork { get; set; }
        public bool IsFlorballBallsNeeded { get; set; }
        public bool IsFlorballGateNeeded { get; set; }
        public bool IsResulutionDressNeeded { get; set; }
        public bool IsConeNeeded { get; set; }
        public bool IsHurdleNeeded { get; set; }
        public bool IsJumpingLadderNeeded { get; set; }
        public bool IsJumpingRopeNeeded { get; set; }
        public bool IsFootballBallNeeded { get; set; }

        public bool    IsCathegoryU7 { get ; set ;}
public bool    IsCathegoryU9 { get ; set ;}
public bool    IsCathegoryU11 { get ; set ;}
public bool    IsCathegoryU13 { get ; set ;}
public bool    IsCathegoryU15 { get ; set ;}
public bool    IsCathegoryU17 { get ; set ;}
public bool    IsCathegoryU21 { get ; set ;}
public bool    IsCathegoryAdult { get ; set ;}


        [NotMapped]
        public long ActivitiesDuration => TrainingActivities.Sum(ta=>ta.DurationMax);


        
        public virtual ICollection<TrainingActivity> TrainingActivities {get;set;} = new HashSet<TrainingActivity>();
       


    }
}