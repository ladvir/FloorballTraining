using System.Collections.Generic;

namespace TrainingGenerator.Models
{
    public class Training
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Duration { get; set; }
        public int PersonsMin { get; set; }
        public int PersonsMax { get; set; }
        public double FlorbalPercent { get; set; }
        public double PrefferedAktivityRatioMin { get; set; }
        public string Note { get; set; }
        public long RatingSum { get; set; }
        public long RatingCount { get; set; }

        public int BeginTimeMin { get; set; }
        public int BeginTimeMax { get; set; }
        public int WarmUpTimeMin { get; set; }
        public int WarmUpTimeMax { get; set; }
        public int WarmUpExcerciseTimeMin { get; set; }
        public int WarmUpExcerciseTimeMax { get; set; }
        public int DrilTimeMin { get; set; }
        public int DrilTimeMax { get; set; }
        public int StretchingTimeMin { get; set; }
        public int StretchingTimeMax { get; set; }
        public int EndTimeMin { get; set; }
        public int EndTimeMax { get; set; }

        public int BlockPauseTimeMin { get; set; }
        public int BlockPauseTimeMax { get; set; }
        public int ActivityPauseTimeMin { get; set; }
        public int ActivityPauseTimeMax { get; set; }

        public List<TrainingActivity> Activities { get; set; }

        public Training(int id, string name, int duration, int personsMin, int personsMax, double florbalPercent, double prefferedAktivityRatioMin, string note, long ratingSum, long ratingCount, int beginTimeMin, int beginTimeMax, int warmUpTimeMin, int warmUpTimeMax, int warmUpExcerciseTimeMin, int warmUpExcerciseTimeMax, int drilTimeMin, int drilTimeMax, int stretchingTimeMin, int stretchingTimeMax, int endTimeMin, int endTimeMax, int blockPauseTimeMin, int blockPauseTimeMax, int activityPauseTimeMin, int activityPauseTimeMax, List<TrainingActivity> activities)
        {
            Id = id;
            Name = name;
            Duration = duration;
            PersonsMin = personsMin;
            PersonsMax = personsMax;
            FlorbalPercent = florbalPercent;
            PrefferedAktivityRatioMin = prefferedAktivityRatioMin;
            Note = note;
            RatingSum = ratingSum;
            RatingCount = ratingCount;
            BeginTimeMin = beginTimeMin;
            BeginTimeMax = beginTimeMax;
            WarmUpTimeMin = warmUpTimeMin;
            WarmUpTimeMax = warmUpTimeMax;
            WarmUpExcerciseTimeMin = warmUpExcerciseTimeMin;
            WarmUpExcerciseTimeMax = warmUpExcerciseTimeMax;
            DrilTimeMin = drilTimeMin;
            DrilTimeMax = drilTimeMax;
            StretchingTimeMin = stretchingTimeMin;
            StretchingTimeMax = stretchingTimeMax;
            EndTimeMin = endTimeMin;
            EndTimeMax = endTimeMax;
            BlockPauseTimeMin = blockPauseTimeMin;
            BlockPauseTimeMax = blockPauseTimeMax;
            ActivityPauseTimeMin = activityPauseTimeMin;
            ActivityPauseTimeMax = activityPauseTimeMax;
            Activities = activities;
        }
    }
}