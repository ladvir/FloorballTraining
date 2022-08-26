using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingGenerator.Models
{
    [Table("TrainingActivity")]
    public class TrainingActivity : IEquatable<TrainingActivity>
    {
        public TrainingActivity()
        { }

        public TrainingActivity(int trainingId, int activityId, int order, int durationMin, int durationMax)
        {
            TrainingId = trainingId;
            ActivityId = activityId;
            Order = order;
            DurationMin = durationMin;
            DurationMax = durationMax;
            //Activity = activity;
        }

        [Key]
        public int TrainingActivityId { get; set; }

        public int TrainingId { get; set; }

        public int ActivityId { get; set; }
        public int Order { get; set; }

        public int DurationMin { get; set; }
        public int DurationMax { get; set; }

        public virtual Training Training { get; set; }
        public virtual Activity Activity { get; set; }

        bool IEquatable<TrainingActivity>.Equals(TrainingActivity? other)
        {
            return Equals(other);
        }

        public override bool Equals(object? obj)
        {
            if (obj == null) return false;
            var objAsTrainingActivity = obj as TrainingActivity;
            if (objAsTrainingActivity == null) return false;
            else return Equals(objAsTrainingActivity);
        }

        public override int GetHashCode()
        {
            return ActivityId;
        }

        public bool Equals(TrainingActivity? other)
        {
            if (other == null) return false;
            return (ActivityId.Equals(other.ActivityId) && TrainingId.Equals(other.TrainingId));
        }
    }
}