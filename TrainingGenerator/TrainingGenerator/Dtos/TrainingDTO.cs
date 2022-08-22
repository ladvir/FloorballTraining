using System.Collections.Generic;
using TrainingGenerator.Models;

namespace TrainingGenerator.Dtos
{
    public class TrainingDTO
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
    }
}