using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.TrainingServices
{
    public class DatabaseTrainingService : ITrainingService
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseTrainingService(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task CreateTraining(Training training)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                TrainingDTO trainingDTO = ToTrainingDTO(training);

                context.Add(trainingDTO);

                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteTraining(Training training)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                TrainingDTO trainingDTO = ToTrainingDTO(training);

                context.Remove(trainingDTO);

                await context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Training>> GetAllTrainings()
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                IEnumerable<TrainingDTO> trainingDTOs = await context.Trainings.ToListAsync();

                return trainingDTOs.Select(r => ToTraining(r));
            }
        }

        public async Task<Training> GetTraining(int id)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                TrainingDTO trainingDTO = await context.Trainings.SingleAsync(a => a.Id == id);

                return ToTraining(trainingDTO);
            }
        }

        public async Task UpdateTraining(Training training)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                TrainingDTO trainingDTO = ToTrainingDTO(training);

                context.Entry(trainingDTO).State = trainingDTO.Id == 0 ?
                        EntityState.Added :
                        EntityState.Modified;

                await context.SaveChangesAsync();
            }
        }

        private Training ToTraining(TrainingDTO dto)
        {
            return new Training(
                dto.Id,
                dto.Name,
                dto.Duration,
                dto.PersonsMin,
                dto.PersonsMax,
                dto.FlorbalPercent,
                dto.PrefferedAktivityRatioMin,
                dto.Note,
                dto.RatingSum,
                dto.RatingCount,
                dto.BeginTimeMin,
                dto.BeginTimeMax,
                dto.WarmUpTimeMin,
                dto.WarmUpTimeMax,
                dto.WarmUpExcerciseTimeMin,
                dto.WarmUpExcerciseTimeMax,
                dto.DrilTimeMin,
                dto.DrilTimeMax,
                dto.StretchingTimeMin,
                dto.StretchingTimeMax,
                dto.EndTimeMin,
                dto.EndTimeMax,
                dto.BlockPauseTimeMin,
                dto.BlockPauseTimeMax,
                dto.ActivityPauseTimeMin,
                dto.ActivityPauseTimeMax,
                dto.Activities
                );
        }

        private TrainingDTO ToTrainingDTO(Training training)
        {
            return new TrainingDTO
            {
                Id = training.Id,
                Name = training.Name,
                Duration = training.Duration,
                PersonsMin = training.PersonsMin,
                PersonsMax = training.PersonsMax,
                FlorbalPercent = training.FlorbalPercent,
                PrefferedAktivityRatioMin = training.PrefferedAktivityRatioMin,
                Note = training.Note,
                RatingSum = training.RatingSum,
                RatingCount = training.RatingCount,
                BeginTimeMin = training.BeginTimeMin,
                BeginTimeMax = training.BeginTimeMax,
                WarmUpTimeMin = training.WarmUpTimeMin,
                WarmUpTimeMax = training.WarmUpTimeMax,
                WarmUpExcerciseTimeMin = training.WarmUpExcerciseTimeMin,
                WarmUpExcerciseTimeMax = training.WarmUpExcerciseTimeMax,
                DrilTimeMin = training.DrilTimeMin,
                DrilTimeMax = training.DrilTimeMax,
                StretchingTimeMin = training.StretchingTimeMin,
                StretchingTimeMax = training.StretchingTimeMax,
                EndTimeMin = training.EndTimeMin,
                EndTimeMax = training.EndTimeMax,
                BlockPauseTimeMin = training.BlockPauseTimeMin,
                BlockPauseTimeMax = training.BlockPauseTimeMax,
                ActivityPauseTimeMin = training.ActivityPauseTimeMin,
                ActivityPauseTimeMax = training.ActivityPauseTimeMax,
                Activities = training.Activities
            };
        }
    }
}