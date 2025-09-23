using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class SeasonEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Season>(dbContextFactory), ISeasonRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        private async Task CheckIfUnique(Season season)
        {
           
                var parameters = new SeasonSpecificationParameters
                {
                    Name = season.Name
                };
        
                var alreadyExistsByName = await GetListAsync(new SeasonsSpecification(parameters));

                if (alreadyExistsByName.Any(x => x.Id != season.Id && x.Name == season.Name))
                {
                    throw new ArgumentException("Sezóna se stejným názvem již existuje.");
                }
        
                parameters = new SeasonSpecificationParameters
                {
                    StartDate = season.StartDate.Date,
                    EndDate = season.EndDate.Date
                };
        
                var alreadyExistsByDateRange = await GetListAsync(new SeasonsSpecification(parameters));
                var x = alreadyExistsByDateRange.Where(a => a.Id != season.Id).ToList();
                
                if (x != null && x.Count != 0)
                {
                   throw new ArgumentException($"Sezóna se stejným rozsahem dat již existuje ( {string.Join(", ", x.Select(y=>y.Name))}).");
                }
        }
        
        public async Task<int> AddSeasonAsync(Season season)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var newSeason = season.Clone();

            newSeason.Name = season.Name;

            newSeason.StartDate = season.StartDate;
            newSeason.EndDate = season.EndDate;
            
            await CheckIfUnique(newSeason);
            
            db.Seasons.Add(newSeason);
            
             await db.SaveChangesAsync();
             return newSeason.Id;
        }

        public async Task<IEnumerable<Season>> GetSeasonsByClubIdAsync(int? clubId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Seasons
                .Include(t => t.Teams)
                .ThenInclude(tp => tp.Club)
                .Where(s => s.Teams.Any(t => t.Club!.Id == clubId)).ToListAsync();
        }

        public async Task UpdateSeasonAsync(Season season)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingSeason = await db.Seasons.FirstOrDefaultAsync(e => e.Id == season.Id);


            if (existingSeason == null)
            {
                existingSeason = season;
            }
            else
            {
                existingSeason.Merge(season);
            }
            
            await CheckIfUnique(season);
            
            foreach (var team in existingSeason.Teams)
            {
               db.Entry(team).State = EntityState.Unchanged;
            }
            
            await db.SaveChangesAsync();
        }

        public async Task DeleteSeasonAsync(int seasonId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var season = await db.Seasons.FirstOrDefaultAsync(e => e.Id == seasonId);

            if (season != null)
            {
                db.Seasons.Remove(season);
                await db.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Season>> GetWithSpecificationInclusiveAsync(SeasonsSpecificationInclusive specification)
        {
            return await base.GetListAsync(specification);
        }
    }
}