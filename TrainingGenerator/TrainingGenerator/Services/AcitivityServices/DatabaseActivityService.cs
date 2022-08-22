using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.AcitivityDeletors
{
    public class DatabaseActivityService : IActivityService
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseActivityService(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<Activity> CreateActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = ToActivityDTO(activity);

                context.Add(activityDTO);

                await context.SaveChangesAsync();

                return ToActivity(activityDTO);
            }
        }

        public async Task<IEnumerable<Activity>> GetAllActivities()
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                IEnumerable<ActivityDTO> activitiesDTOs = await context.Activities.ToListAsync();

                return activitiesDTOs.Select(r => ToActivity(r));
            }
        }

        public async Task<Activity> GetActivity(int id)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = await context.Activities.SingleAsync(a => a.Id == id);

                return ToActivity(activityDTO);
            }
        }

        public async Task UpdateActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = ToActivityDTO(activity);

                context.Entry(activityDTO).State = activityDTO.Id == 0 ?
                        EntityState.Added :
                        EntityState.Modified;

                await context.SaveChangesAsync();
            }
        }

        private static Activity ToActivity(ActivityDTO dto)
        {
            return new Activity(dto.Id,
            dto.Name,
            dto.Description,
            dto.PersonsMin,
            dto.PersonsMax,
            dto.DurationMin,
            dto.DurationMax,
            dto.RatingSum,
            dto.RatingCount,
            dto.IsGameSituation1x1,
            dto.IsGameSituation2x2,
            dto.IsGameSituation3x3,
            dto.IsGameSituation4x4,
            dto.IsGameSituation5x5,
            dto.IsGameSituation2x3,
            dto.IsGameSituation2x1,
            dto.IsForGoalman,
            dto.IsForForward,
            dto.IsForDefender,
            dto.IsTrainingPartWarmUp,
            dto.IsTrainingWarmUpExcercise,
            dto.IsTrainingPartDril,
            dto.IsTrainingPartStretching,
            dto.IsGame,
            dto.IsFlorbal,
            dto.IsTest,
            dto.IsRelay,
            dto.IsShooting,
            dto.IsPass,
            dto.IsBallLeading,
            dto.IsFlexibility,
            dto.IsStrength,
            dto.IsDynamic,
            dto.IsReleasing,
            dto.IsSpeed,
            dto.IsPersistence,
            dto.IsThinking,
            dto.IsTeamWork,
            dto.IsFlorballBallsNeeded,
            dto.IsFlorballGateNeeded,
            dto.IsResulutionDressNeeded,
            dto.IsConeNeeded,
            dto.IsHurdleNeeded,
            dto.IsJumpingLadderNeeded,
            dto.IsJumpingRopeNeeded,
            dto.IsFootballBallNeeded
            );
        }

        private static ActivityDTO ToActivityDTO(Activity activity)
        {
            return new ActivityDTO
            {
                Id = activity.Id,
                Name = activity.Name,
                Description = activity.Description,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax,
                RatingSum = activity.RatingSum,
                RatingCount = activity.RatingCount,
                IsGameSituation1x1 = activity.IsGameSituation1x1,
                IsGameSituation2x2 = activity.IsGameSituation2x2,
                IsGameSituation3x3 = activity.IsGameSituation3x3,
                IsGameSituation4x4 = activity.IsGameSituation4x4,
                IsGameSituation5x5 = activity.IsGameSituation5x5,
                IsGameSituation2x3 = activity.IsGameSituation2x3,
                IsGameSituation2x1 = activity.IsGameSituation2x1,
                IsForGoalman = activity.IsForGoalman,
                IsForForward = activity.IsForForward,
                IsForDefender = activity.IsForDefender,
                IsTrainingPartWarmUp = activity.IsTrainingPartWarmUp,
                IsTrainingWarmUpExcercise = activity.IsTrainingWarmUpExcercise,
                IsTrainingPartDril = activity.IsTrainingPartDril,
                IsTrainingPartStretching = activity.IsTrainingPartStretching,
                IsGame = activity.IsGame,
                IsFlorbal = activity.IsFlorbal,
                IsTest = activity.IsTest,
                IsRelay = activity.IsRelay,
                IsShooting = activity.IsShooting,
                IsPass = activity.IsPass,
                IsBallLeading = activity.IsBallLeading,
                IsFlexibility = activity.IsFlexibility,
                IsStrength = activity.IsStrength,
                IsDynamic = activity.IsDynamic,
                IsReleasing = activity.IsReleasing,
                IsSpeed = activity.IsSpeed,
                IsPersistence = activity.IsPersistence,
                IsThinking = activity.IsThinking,
                IsTeamWork = activity.IsTeamWork,
                IsFlorballBallsNeeded = activity.IsFlorballBallsNeeded,
                IsFlorballGateNeeded = activity.IsFlorballGateNeeded,
                IsResulutionDressNeeded = activity.IsResulutionDressNeeded,
                IsConeNeeded = activity.IsConeNeeded,
                IsHurdleNeeded = activity.IsHurdleNeeded,
                IsJumpingLadderNeeded = activity.IsJumpingLadderNeeded,
                IsJumpingRopeNeeded = activity.IsJumpingRopeNeeded,
                IsFootballBallNeeded = activity.IsFootballBallNeeded,
            };
        }

        public async Task DeleteActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = ToActivityDTO(activity);

                context.Remove(activityDTO);

                await context.SaveChangesAsync();
            }
        }
    }
}