using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingGenerator.Models
{
    [Table("Activity")]
    public class Activity //: IEquatable<Activity>
    {
        [Key]
        public int ActivityId { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }
        public int? DurationMax { get; set; }
        public long RatingSum { get; set; }
        public long RatingCount { get; set; }
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



        public virtual ICollection<TrainingActivity> TrainingActivities { get; set; }

        public Activity()
        {
            TrainingActivities = new HashSet<TrainingActivity>();
        }

        /*bool IEquatable<Activity>.Equals(Activity? other)
        {
            return Equals(other);
        }

        public override bool Equals(object? obj)
        {
            if (obj == null) return false;
            var objAsActivity = obj as Activity;
            if (objAsActivity == null) return false;
            else return Equals(objAsActivity);
        }

        public override int GetHashCode()
        {
            return ActivityId;
        }

        public bool Equals(Activity? other)
        {
            if (other == null) return false;
            return (Name.Equals(other.Name));
        }*/
    }
}