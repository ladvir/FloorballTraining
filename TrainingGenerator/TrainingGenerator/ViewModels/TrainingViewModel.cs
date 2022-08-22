using TrainingGenerator.Models;

namespace TrainingGenerator.ViewModels
{
    public class TrainingViewModel : ViewModelBase
    {
        private readonly Training _training;

        public int Id => _training.Id;
        public string Name => _training.Name;
        public int Duration => _training.Duration;
        public int PersonsMin => _training.PersonsMin;
        public int PersonsMax => _training.PersonsMax;
        public double FlorbalPercent => _training.FlorbalPercent;
        public double PrefferedAktivityRatioMin => _training.PrefferedAktivityRatioMin;
        public string Note => _training.Note;
        public long RatingSum => _training.RatingSum;
        public long RatingCount => _training.RatingCount;
        public int BeginTimeMin => _training.BeginTimeMin;
        public int BeginTimeMax => _training.BeginTimeMax;
        public int WarmUpTimeMin => _training.WarmUpTimeMin;
        public int WarmUpTimeMax => _training.WarmUpTimeMax;
        public int WarmUpExcerciseTimeMin => _training.WarmUpExcerciseTimeMin;
        public int WarmUpExcerciseTimeMax => _training.WarmUpExcerciseTimeMax;
        public int DrilTimeMin => _training.DrilTimeMin;
        public int DrilTimeMax => _training.DrilTimeMax;
        public int StretchingTimeMin => _training.StretchingTimeMin;
        public int StretchingTimeMax => _training.StretchingTimeMax;
        public int EndTimeMin => _training.EndTimeMin;
        public int EndTimeMax => _training.EndTimeMax;
        public int BlockPauseTimeMin => _training.BlockPauseTimeMin;
        public int BlockPauseTimeMax => _training.BlockPauseTimeMax;
        public int ActivityPauseTimeMin => _training.ActivityPauseTimeMin;
        public int ActivityPauseTimeMax => _training.ActivityPauseTimeMax;

        public TrainingViewModel(Training training)
        {
            _training = training;
        }

        public Training Training => _training;
    }
}