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

        public override async Task<IReadOnlyList<Season>> GetAllAsync()
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Seasons.Include(s => s.Club).ToListAsync();
        }

        private async Task CheckIfUnique(Season season)
        {
            var parameters = new SeasonSpecificationParameters
            {
                Name = season.Name
            };

            var alreadyExistsByName = await GetListAsync(new SeasonsSpecification(parameters));

            if (alreadyExistsByName.Any(x => x.Id != season.Id && x.Name == season.Name && x.ClubId == season.ClubId))
            {
                throw new ArgumentException("Sezóna se stejným názvem již existuje v tomto klubu.");
            }

            parameters = new SeasonSpecificationParameters
            {
                StartDate = season.StartDate.Date,
                EndDate = season.EndDate.Date
            };

            var alreadyExistsByDateRange = await GetListAsync(new SeasonsSpecification(parameters));
            var x = alreadyExistsByDateRange.Where(a => a.Id != season.Id && a.ClubId == season.ClubId).ToList();

            if (x != null && x.Count != 0)
            {
               throw new ArgumentException($"Sezóna se stejným rozsahem dat již existuje v tomto klubu ( {string.Join(", ", x.Select(y=>y.Name))}).");
            }
        }

        public async Task<Season?> GetSeasonByIdWithTeamsAsync(int id)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Seasons
                .Include(s => s.Teams)
                .Include(s => s.Club)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<int> AddSeasonAsync(Season season)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var newSeason = new Season
            {
                Name = season.Name,
                StartDate = season.StartDate,
                EndDate = season.EndDate,
                ClubId = season.ClubId,
            };

            await CheckIfUnique(newSeason);

            db.Seasons.Add(newSeason);
            await db.SaveChangesAsync();
            return newSeason.Id;
        }

        public async Task<IEnumerable<Season>> GetSeasonsByClubIdAsync(int? clubId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Seasons
                .Include(s => s.Teams)
                .Include(s => s.Club)
                .Where(s => s.ClubId == clubId)
                .ToListAsync();
        }

        public async Task UpdateSeasonAsync(Season season)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingSeason = await db.Seasons
                .FirstOrDefaultAsync(e => e.Id == season.Id);

            if (existingSeason == null) return;

            var nameChanged = existingSeason.Name != season.Name;
            var datesChanged = existingSeason.StartDate.Date != season.StartDate.Date
                            || existingSeason.EndDate.Date != season.EndDate.Date;

            existingSeason.Name = season.Name;
            existingSeason.StartDate = season.StartDate;
            existingSeason.EndDate = season.EndDate;
            existingSeason.ClubId = season.ClubId;

            // Only check uniqueness when name or dates actually changed
            if (nameChanged || datesChanged)
                await CheckIfUnique(existingSeason);

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
