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

        public string Note => _training.Note;
        public int BeginTimeMax => _training.BeginTimeMax;
        public int WarmUpTimeMax => _training.WarmUpTimeMax;
        public int WarmUpExcerciseTimeMax => _training.WarmUpExcerciseTimeMax;
        public int DrilTimeMax => _training.DrilTimeMax;
        public int StretchingTimeMax => _training.StretchingTimeMax;
        public int EndTimeMax => _training.EndTimeMax;
        public int BlockPauseTimeMax => _training.BlockPauseTimeMax;
        public int ActivityPauseTimeMax => _training.ActivityPauseTimeMax;

        public bool IsGameSituation1x1 => _training.IsGameSituation1x1;
        public bool IsGameSituation2x2 => _training.IsGameSituation2x2;
        public bool IsGameSituation3x3 => _training.IsGameSituation3x3;
        public bool IsGameSituation4x4 => _training.IsGameSituation4x4;
        public bool IsGameSituation5x5 => _training.IsGameSituation5x5;
        public bool IsGameSituation2x3 => _training.IsGameSituation2x3;
        public bool IsGameSituation2x1 => _training.IsGameSituation2x1;
        public bool IsForGoalman => _training.IsForGoalman;
        public bool IsForForward => _training.IsForForward;
        public bool IsForDefender => _training.IsForDefender;
        public bool IsTrainingPartWarmUp => _training.IsTrainingPartWarmUp;
        public bool IsTrainingWarmUpExcercise => _training.IsTrainingWarmUpExcercise;
        public bool IsTrainingPartDril => _training.IsTrainingPartDril;
        public bool IsTrainingPartStretching => _training.IsTrainingPartStretching;
        public bool IsGame => _training.IsGame;
        public bool IsFlorbal => _training.IsFlorbal;
        public bool IsTest => _training.IsTest;
        public bool IsRelay => _training.IsRelay;
        public bool IsShooting => _training.IsShooting;
        public bool IsPass => _training.IsPass;
        public bool IsBallLeading => _training.IsBallLeading;
        public bool IsFlexibility => _training.IsFlexibility;
        public bool IsStrength => _training.IsStrength;
        public bool IsDynamic => _training.IsDynamic;
        public bool IsReleasing => _training.IsReleasing;
        public bool IsSpeed => _training.IsSpeed;
        public bool IsPersistence => _training.IsPersistence;
        public bool IsThinking => _training.IsThinking;
        public bool IsTeamWork => _training.IsTeamWork;
        public bool IsFlorballBallsNeeded => _training.IsFlorballBallsNeeded;
        public bool IsFlorballGateNeeded => _training.IsFlorballGateNeeded;
        public bool IsResulutionDressNeeded => _training.IsResulutionDressNeeded;
        public bool IsConeNeeded => _training.IsConeNeeded;
        public bool IsHurdleNeeded => _training.IsHurdleNeeded;
        public bool IsJumpingLadderNeeded => _training.IsJumpingLadderNeeded;
        public bool IsJumpingRopeNeeded => _training.IsJumpingRopeNeeded;
        public bool IsFootballBallNeeded => _training.IsFootballBallNeeded;


        public long ActivitiesDuration => _training.ActivitiesDuration;

        public TrainingViewModel(Training training)
        {
            _training = training;
        }

        public Training Training => _training;
    }
}