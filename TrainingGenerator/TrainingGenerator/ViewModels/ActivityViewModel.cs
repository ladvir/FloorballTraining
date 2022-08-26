using TrainingGenerator.Models;

namespace TrainingGenerator.ViewModels
{
    public class ActivityViewModel : ViewModelBase
    {
        private readonly Activity _activity;

        public int Id => _activity.ActivityId;
        public string Name => _activity.Name;
        public string Description => _activity.Description;
        public int PersonsMin => _activity.PersonsMin;
        public int? PersonsMax => _activity.PersonsMax;
        public int? DurationMin => _activity.DurationMin;
        public int? DurationMax => _activity.DurationMax;
        public long RatingSum => _activity.RatingSum;
        public long RatingCount => _activity.RatingCount;
        public bool IsGameSituation1x1 => _activity.IsGameSituation1x1;
        public bool IsGameSituation2x2 => _activity.IsGameSituation2x2;
        public bool IsGameSituation3x3 => _activity.IsGameSituation3x3;
        public bool IsGameSituation4x4 => _activity.IsGameSituation4x4;
        public bool IsGameSituation5x5 => _activity.IsGameSituation5x5;
        public bool IsGameSituation2x3 => _activity.IsGameSituation2x3;
        public bool IsGameSituation2x1 => _activity.IsGameSituation2x1;
        public bool IsForGoalman => _activity.IsForGoalman;
        public bool IsForForward => _activity.IsForForward;
        public bool IsForDefender => _activity.IsForDefender;
        public bool IsTrainingPartWarmUp => _activity.IsTrainingPartWarmUp;
        public bool IsTrainingWarmUpExcercise => _activity.IsTrainingWarmUpExcercise;
        public bool IsTrainingPartDril => _activity.IsTrainingPartDril;
        public bool IsTrainingPartStretching => _activity.IsTrainingPartStretching;
        public bool IsGame => _activity.IsGame;
        public bool IsFlorbal => _activity.IsFlorbal;
        public bool IsTest => _activity.IsTest;
        public bool IsRelay => _activity.IsRelay;
        public bool IsShooting => _activity.IsShooting;
        public bool IsPass => _activity.IsPass;
        public bool IsBallLeading => _activity.IsBallLeading;
        public bool IsFlexibility => _activity.IsFlexibility;
        public bool IsStrength => _activity.IsStrength;
        public bool IsDynamic => _activity.IsDynamic;
        public bool IsReleasing => _activity.IsReleasing;
        public bool IsSpeed => _activity.IsSpeed;
        public bool IsPersistence => _activity.IsPersistence;
        public bool IsThinking => _activity.IsThinking;
        public bool IsTeamWork => _activity.IsTeamWork;
        public bool IsFlorballBallsNeeded => _activity.IsFlorballBallsNeeded;
        public bool IsFlorballGateNeeded => _activity.IsFlorballGateNeeded;
        public bool IsResulutionDressNeeded => _activity.IsResulutionDressNeeded;
        public bool IsConeNeeded => _activity.IsConeNeeded;
        public bool IsHurdleNeeded => _activity.IsHurdleNeeded;
        public bool IsJumpingLadderNeeded => _activity.IsJumpingLadderNeeded;
        public bool IsJumpingRopeNeeded => _activity.IsJumpingRopeNeeded;
        public bool IsFootballBallNeeded => _activity.IsFootballBallNeeded;

        public ActivityViewModel(Activity activity)
        {
            _activity = activity;
        }

        public Activity Activity => _activity;
    }
}