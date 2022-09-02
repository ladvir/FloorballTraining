using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingGenerator.Models
{
    [Table("TrainingActivity")]
    public class TrainingActivity : IEquatable<TrainingActivity>
    {
        [Key]
        public int TrainingActivityId { get; set; }

        public int TrainingId { get; set; }

        public int Order { get; set; }

        public int DurationMax { get; set; }

        public virtual Training Training { get; set; }

        [Required]
        public int? ActivityId { get; set; }

        [ForeignKey("ActivityId")]
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
            return TrainingActivityId.GetHashCode() + TrainingId.GetHashCode() * 17 + ActivityId.GetHashCode();
        }

        public bool Equals(TrainingActivity? other)
        {
            if (other == null) return false;

            return TrainingId.Equals(other.TrainingId) && ActivityId.Equals(other.ActivityId);
        }
    }
}