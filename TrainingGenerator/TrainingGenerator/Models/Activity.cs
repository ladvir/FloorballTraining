using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingGenerator.Models
{
    [Table("Activity")]
    public class Activity : IEquatable<Activity>
    {
        [Key]
        public int ActivityId { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public int PersonsMin { get; set; }
        public int? PersonsMax { get; set; }
        public int? DurationMin { get; set; }
        public int? DurationMax { get; set; }
        public long RatingSum { get; set; }
        public long RatingCount { get; set; }
        public bool IsGameSituation1x1 { get; set; }
        public bool IsGameSituation2x2 { get; set; }
        public bool IsGameSituation3x3 { get; set; }
        public bool IsGameSituation4x4 { get; set; }
        public bool IsGameSituation5x5 { get; set; }
        public bool IsGameSituation2x3 { get; set; }
        public bool IsGameSituation2x1 { get; set; }
        public bool IsForGoalman { get; set; }
        public bool IsForForward { get; set; }
        public bool IsForDefender { get; set; }
        public bool IsTrainingPartWarmUp { get; set; }
        public bool IsTrainingWarmUpExcercise { get; set; }
        public bool IsTrainingPartDril { get; set; }
        public bool IsTrainingPartStretching { get; set; }
        public bool IsGame { get; set; }
        public bool IsFlorbal { get; set; }
        public bool IsTest { get; set; }
        public bool IsRelay { get; set; }
        public bool IsShooting { get; set; }
        public bool IsPass { get; set; }
        public bool IsBallLeading { get; set; }
        public bool IsFlexibility { get; set; }
        public bool IsStrength { get; set; }
        public bool IsDynamic { get; set; }
        public bool IsReleasing { get; set; }
        public bool IsSpeed { get; set; }
        public bool IsPersistence { get; set; }
        public bool IsThinking { get; set; }
        public bool IsTeamWork { get; set; }
        public bool IsFlorballBallsNeeded { get; set; }
        public bool IsFlorballGateNeeded { get; set; }
        public bool IsResulutionDressNeeded { get; set; }
        public bool IsConeNeeded { get; set; }
        public bool IsHurdleNeeded { get; set; }
        public bool IsJumpingLadderNeeded { get; set; }
        public bool IsJumpingRopeNeeded { get; set; }
        public bool IsFootballBallNeeded { get; set; }

        public Activity(int activityId, string name, string description, int personsMin, int? personsMax, int? durationMin, int? durationMax, long ratingSum, long ratingCount, bool isGameSituation1x1, bool isGameSituation2x2, bool isGameSituation3x3, bool isGameSituation4x4, bool isGameSituation5x5, bool isGameSituation2x3, bool isGameSituation2x1, bool isForGoalman, bool isForForward, bool isForDefender, bool isTrainingPartWarmUp, bool isTrainingWarmUpExcercise, bool isTrainingPartDril, bool isTrainingPartStretching, bool isGame, bool isFlorbal, bool isTest, bool isRelay, bool isShooting, bool isPass, bool isBallLeading, bool isFlexibility, bool isStrength, bool isDynamic, bool isReleasing, bool isSpeed, bool isPersistence, bool isThinking, bool isTeamWork, bool isFlorballBallsNeeded, bool isFlorballGateNeeded, bool isResulutionDressNeeded, bool isConeNeeded, bool isHurdleNeeded, bool isJumpingLadderNeeded, bool isJumpingRopeNeeded, bool isFootballBallNeeded)
        {
            ActivityId = activityId;
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

        bool IEquatable<Activity>.Equals(Activity? other)
        {
            return Equals(other);
        }

        public override bool Equals(object? obj)
        {
            if (obj == null) return false;
            var objAsActivity = obj as Activity;
            if (objAsActivity == null) return false;
            else return Equals(objAsActivity);
        }

        public override int GetHashCode()
        {
            return ActivityId;
        }

        public bool Equals(Activity? other)
        {
            if (other == null) return false;
            return (ActivityId.Equals(other.ActivityId));
        }
    }
}