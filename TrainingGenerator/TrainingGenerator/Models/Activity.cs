namespace TrainingGenerator.Models
{
    public class Activity
    {
        public int Id { get; }
        public string Name { get; }
        public string Description { get; }
        public int PersonsMin { get; }
        public int? PersonsMax { get; }
        public int? DurationMin { get; }
        public int? DurationMax { get; }
        public long RatingSum { get; }
        public long RatingCount { get; }
        public bool IsGameSituation1x1 { get; }
        public bool IsGameSituation2x2 { get; }
        public bool IsGameSituation3x3 { get; }
        public bool IsGameSituation4x4 { get; }
        public bool IsGameSituation5x5 { get; }
        public bool IsGameSituation2x3 { get; }
        public bool IsGameSituation2x1 { get; }
        public bool IsForGoalman { get; }
        public bool IsForForward { get; }
        public bool IsForDefender { get; }
        public bool IsTrainingPartWarmUp { get; }
        public bool IsTrainingWarmUpExcercise { get; }
        public bool IsTrainingPartDril { get; }
        public bool IsTrainingPartStretching { get; }
        public bool IsGame { get; }
        public bool IsFlorbal { get; }
        public bool IsTest { get; }
        public bool IsRelay { get; }
        public bool IsShooting { get; }
        public bool IsPass { get; }
        public bool IsBallLeading { get; }
        public bool IsFlexibility { get; }
        public bool IsStrength { get; }
        public bool IsDynamic { get; }
        public bool IsReleasing { get; }
        public bool IsSpeed { get; }
        public bool IsPersistence { get; }
        public bool IsThinking { get; }
        public bool IsTeamWork { get; }
        public bool IsFlorballBallsNeeded { get; }
        public bool IsFlorballGateNeeded { get; }
        public bool IsResulutionDressNeeded { get; }
        public bool IsConeNeeded { get; }
        public bool IsHurdleNeeded { get; }
        public bool IsJumpingLadderNeeded { get; }
        public bool IsJumpingRopeNeeded { get; }
        public bool IsFootballBallNeeded { get; }

        public Activity(int id, string name, string description, int personsMin, int? personsMax, int? durationMin, int? durationMax, long ratingSum, long ratingCount, bool isGameSituation1x1, bool isGameSituation2x2, bool isGameSituation3x3, bool isGameSituation4x4, bool isGameSituation5x5, bool isGameSituation2x3, bool isGameSituation2x1, bool isForGoalman, bool isForForward, bool isForDefender, bool isTrainingPartWarmUp, bool isTrainingWarmUpExcercise, bool isTrainingPartDril, bool isTrainingPartStretching, bool isGame, bool isFlorbal, bool isTest, bool isRelay, bool isShooting, bool isPass, bool isBallLeading, bool isFlexibility, bool isStrength, bool isDynamic, bool isReleasing, bool isSpeed, bool isPersistence, bool isThinking, bool isTeamWork, bool isFlorballBallsNeeded, bool isFlorballGateNeeded, bool isResulutionDressNeeded, bool isConeNeeded, bool isHurdleNeeded, bool isJumpingLadderNeeded, bool isJumpingRopeNeeded, bool isFootballBallNeeded)
        {
            Id = id;
            Name = name;
            Description = description;
            PersonsMin = personsMin;
            PersonsMax = personsMax;
            DurationMin = durationMin;
            DurationMax = durationMax;
            RatingSum = ratingSum;
            RatingCount = ratingCount;
            IsGameSituation1x1 = isGameSituation1x1;
            IsGameSituation2x2 = isGameSituation2x2;
            IsGameSituation3x3 = isGameSituation3x3;
            IsGameSituation4x4 = isGameSituation4x4;
            IsGameSituation5x5 = isGameSituation5x5;
            IsGameSituation2x3 = isGameSituation2x3;
            IsGameSituation2x1 = isGameSituation2x1;
            IsForGoalman = isForGoalman;
            IsForForward = isForForward;
            IsForDefender = isForDefender;
            IsTrainingPartWarmUp = isTrainingPartWarmUp;
            IsTrainingWarmUpExcercise = isTrainingWarmUpExcercise;
            IsTrainingPartDril = isTrainingPartDril;
            IsTrainingPartStretching = isTrainingPartStretching;
            IsGame = isGame;
            IsFlorbal = isFlorbal;
            IsTest = isTest;
            IsRelay = isRelay;
            IsShooting = isShooting;
            IsPass = isPass;
            IsBallLeading = isBallLeading;
            IsFlexibility = isFlexibility;
            IsStrength = isStrength;
            IsDynamic = isDynamic;
            IsReleasing = isReleasing;
            IsSpeed = isSpeed;
            IsPersistence = isPersistence;
            IsThinking = isThinking;
            IsTeamWork = isTeamWork;
            IsFlorballBallsNeeded = isFlorballBallsNeeded;
            IsFlorballGateNeeded = isFlorballGateNeeded;
            IsResulutionDressNeeded = isResulutionDressNeeded;
            IsConeNeeded = isConeNeeded;
            IsHurdleNeeded = isHurdleNeeded;
            IsJumpingLadderNeeded = isJumpingLadderNeeded;
            IsJumpingRopeNeeded = isJumpingRopeNeeded;
            IsFootballBallNeeded = isFootballBallNeeded;
        }
    }
}