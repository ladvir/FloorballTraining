using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TeamEFCoreRepository : GenericEFCoreRepository<Team>, ITeamRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public TeamEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }

        public async Task AddTeamAsync(Team team)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var newTeam = team.Clone();

            newTeam.Name = team.Name;

            newTeam.AgeGroup = null;
            newTeam.AgeGroupId = team.AgeGroupId;



            foreach (var teamTraining in team.TeamTrainings)
            {
                teamTraining.Training = null;
            }


            db.Teams.Add(newTeam);

            await db.SaveChangesAsync();
        }



        /*
public async Task DeleteAsync(int id)
{
   await using var db = await _dbContextFactory.CreateDbContextAsync();

   var training = await GetTrainingByIdAsync(id);

   if (training != null)
   {

       if (training.TrainingParts != null)
       {
           var trainingParts = training.TrainingParts.ToList();
           var trainingGroups = trainingParts.Where(tg => tg.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!).ToList();




           if (trainingGroups.Any())
               db.TrainingGroups.RemoveRange(trainingGroups);

           db.TrainingParts.RemoveRange(trainingParts);
       }

       var trainingAgeGroups = training.TrainingAgeGroups.ToList();
       db.TrainingAgeGroups.RemoveRange(trainingAgeGroups);

       db.Trainings.Remove(training);
       await db.SaveChangesAsync();
   }
}

public async Task<Training?> GetTrainingByIdAsync(int trainingId)
{
   await using var db = await _dbContextFactory.CreateDbContextAsync();
   return await db.Trainings
       .Include(t => t.Place)
       .Include(t => t.TrainingAgeGroups)
       .ThenInclude(tag => tag.AgeGroup)
       .Include(t => t.TrainingGoal1)
       .Include(t => t.TrainingGoal2)
       .Include(t => t.TrainingGoal3)
       .Include(t => t.TrainingParts)!
       .ThenInclude(tp => tp.TrainingGroups!)
       .ThenInclude(tg => tg.Activity)
       .ThenInclude(tag => tag!.ActivityTags)

       .Include(t => t.TrainingParts!)
       .ThenInclude(tp => tp.TrainingGroups!)
       .ThenInclude(tg => tg.Activity)
       .ThenInclude(tag => tag!.ActivityEquipments).ThenInclude(ae => ae.Equipment)

       .FirstOrDefaultAsync(a => a.Id == trainingId);
}


public async Task UpdateTrainingAsync(Training training)
{
   await using var db = await _dbContextFactory.CreateDbContextAsync();

   var existingTraining = await db.Trainings
       .Include(t => t.TrainingAgeGroups).ThenInclude(tag => tag.AgeGroup)
       .Include(t => t.TrainingGoal1)
       .Include(t => t.TrainingGoal2)
       .Include(t => t.TrainingGoal3)
       .Include(t => t.Place)
       .Include(t => t.TrainingParts!)
       .ThenInclude(tp => tp.TrainingGroups!)
       .ThenInclude(tg => tg.Activity)
       .FirstAsync(a => a.Id == training.Id);



   training.TrainingGoal1Id = training.TrainingGoal1?.Id;

   training.TrainingGoal1 = null;

   existingTraining.TrainingGoal1Id = null;
   existingTraining.TrainingGoal2Id = null;
   existingTraining.TrainingGoal3Id = null;

   existingTraining.TrainingGoal1 = null;
   existingTraining.TrainingGoal2 = null;
   existingTraining.TrainingGoal3 = null;



   if (training.TrainingGoal2 != null)
   {
       training.TrainingGoal2Id = training.TrainingGoal2.Id;
       training.TrainingGoal2 = null;

   }

   if (training.TrainingGoal3 != null)
   {
       training.TrainingGoal3Id = training.TrainingGoal3.Id;
       training.TrainingGoal3 = null;
   }


   training.PlaceId = training.Place!.Id;

   UpdateTrainingAgeGroups(training, existingTraining);

   UpdateTrainingParts(training, existingTraining, db);


   db.Entry(existingTraining).CurrentValues.SetValues(training);

   await db.SaveChangesAsync(true);
}

public async Task<Training> CloneTrainingAsync(int TrainingId)
{
   var training = await GetTrainingByIdAsync(TrainingId);
   if (training == null) throw new Exception("Trénink pro klonování nenalezen");

   await using var db = await _dbContextFactory.CreateDbContextAsync();

   var clone = Clone(training, db);

   db.Trainings.Add(clone);
   await db.SaveChangesAsync();

   return clone;
}


private Training Clone(Training training, FloorballTrainingContext db)
{
   var clone = new Training
   {
       Id = default,
       Place = training.Place,
       Name = training.Name + " - kopie",
       Description = training.Description,
       Duration = training.Duration,
       PersonsMin = training.PersonsMin,
       PersonsMax = training.PersonsMax,
       GoaliesMin = training.GoaliesMin,
       GoaliesMax = training.GoaliesMax,
       TrainingGoal1 = training.TrainingGoal1,
       TrainingGoal1Id = training.TrainingGoal1Id,
       TrainingGoal2 = training.TrainingGoal2,
       TrainingGoal2Id = training.TrainingGoal2Id,
       TrainingGoal3 = training.TrainingGoal3,
       TrainingGoal3Id = training.TrainingGoal3Id,
       Difficulty = training.Difficulty,
       Intensity = training.Intensity,
       CommentBefore = training.CommentBefore,
       CommentAfter = training.CommentAfter,
       TrainingParts = training.TrainingParts,
       TrainingAgeGroups = training.TrainingAgeGroups
   };

   if (clone.Place != null) db.Entry(clone.Place!).State = EntityState.Unchanged;
   if (clone.TrainingGoal1 != null) db.Entry(clone.TrainingGoal1!).State = EntityState.Unchanged;
   if (clone.TrainingGoal2 != null) db.Entry(clone.TrainingGoal2!).State = EntityState.Unchanged;
   if (clone.TrainingGoal3 != null) db.Entry(clone.TrainingGoal3!).State = EntityState.Unchanged;

   if (clone.TrainingParts != null)
   {
       foreach (var trainingPart in clone.TrainingParts)
       {
           trainingPart.Id = default;
           db.Entry(trainingPart).State = EntityState.Added;


           if (trainingPart.TrainingGroups != null)
           {
               foreach (var trainingGroup in trainingPart.TrainingGroups)
               {
                   trainingGroup.Id = default;
                   db.Entry(trainingGroup).State = EntityState.Added;

                   if (trainingGroup.Activity != null)
                       db.Entry(trainingGroup.Activity).State = EntityState.Unchanged;
               }
           }
       }
   }


   foreach (var trainingAgeGroup in clone.TrainingAgeGroups)
   {
       trainingAgeGroup.Id = default;
       db.Entry(trainingAgeGroup).State = EntityState.Added;
       if (trainingAgeGroup.AgeGroup != null) db.Entry(trainingAgeGroup.AgeGroup!).State = EntityState.Unchanged;
   }


   return clone;
}


*/



    }
}