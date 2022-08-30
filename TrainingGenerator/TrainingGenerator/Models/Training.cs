using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public double PrefferedAktivityRatioMin { get; set; }

        public string Note { get; set; } = string.Empty;

        public int BeginTimeMax { get; set; }
        public int WarmUpTimeMax { get; set; }
        public int WarmUpExcerciseTimeMax { get; set; }
        public int DrilTimeMax { get; set; }
        public int StretchingTimeMax { get; set; }
        public int EndTimeMax { get; set; }
        public int BlockPauseTimeMax { get; set; }
        public int ActivityPauseTimeMax { get; set; }

        public virtual ICollection<TrainingActivity> TrainingActivities { get; set; }

        public Training()
        {
            TrainingActivities = new HashSet<TrainingActivity>();
        }

        public Training(int trainingId, string name, int duration, int personsMin, int personsMax, int florbalPercent, double prefferedAktivityRatioMin, string note, int beginTimeMax, int warmUpTimeMax, int warmUpExcerciseTimeMax, int drilTimeMax, int stretchingTimeMax, int endTimeMax, int blockPauseTimeMax, int activityPauseTimeMax)
        {
            TrainingId = trainingId;
            Name = name;
            Duration = duration;
            PersonsMin = personsMin;
            PersonsMax = personsMax;
            FlorbalPercent = florbalPercent;
            PrefferedAktivityRatioMin = prefferedAktivityRatioMin;
            Note = note;
            BeginTimeMax = beginTimeMax;
            WarmUpTimeMax = warmUpTimeMax;
            WarmUpExcerciseTimeMax = warmUpExcerciseTimeMax;
            DrilTimeMax = drilTimeMax;
            StretchingTimeMax = stretchingTimeMax;
            EndTimeMax = endTimeMax;
            BlockPauseTimeMax = blockPauseTimeMax;
            ActivityPauseTimeMax = activityPauseTimeMax;
        }
    }
}