using TrainingGenerator.Models;

namespace TrainingGenerator.ViewModels
{
    public class TrainingViewModel : ViewModelBase
    {
        private readonly Training _training;

        public int Id => _training.TrainingId;
        public string Name => _training.Name;
        public int Duration => _training.Duration;
        public int PersonsMin => _training.PersonsMin;
        public int PersonsMax => _training.PersonsMax;
        public double FlorbalPercent => _training.FlorbalPercent;
        public double PrefferedAktivityRatioMin => _training.PrefferedAktivityRatioMin;
        public string Note => _training.Note;
        public int BeginTimeMax => _training.BeginTimeMax;
        public int WarmUpTimeMax => _training.WarmUpTimeMax;
        public int WarmUpExcerciseTimeMax => _training.WarmUpExcerciseTimeMax;
        public int DrilTimeMax => _training.DrilTimeMax;
        public int StretchingTimeMax => _training.StretchingTimeMax;
        public int EndTimeMax => _training.EndTimeMax;
        public int BlockPauseTimeMax => _training.BlockPauseTimeMax;
        public int ActivityPauseTimeMax => _training.ActivityPauseTimeMax;

        public TrainingViewModel(Training training)
        {
            _training = training;
        }

        public Training Training => _training;
    }
}