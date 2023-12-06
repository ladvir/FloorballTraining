using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class PlaceEFCoreRepository : IPlaceRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public PlaceEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }

        public async Task<List<Place>> GetPlacesByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();


            return await db.Places.Where(ag => string.IsNullOrWhiteSpace(searchString) || ag.Name.ToLower().Contains(searchString.ToLower())).OrderBy(e => e.Name).ToListAsync();
        }


        public async Task<Place> GetPlaceByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Places.FirstOrDefaultAsync(ag => ag.Name.ToLower().Contains(searchString.ToLower())) ?? new Place();
        }

        public async Task<bool> ExistsPlaceByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Places.FirstOrDefaultAsync(ag => ag.Name.ToLower().Contains(searchString.ToLower())) != null;
        }


        public async Task UpdatePlaceAsync(Place place)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingPlace = await db.Places.FirstOrDefaultAsync(e => e.Id == place.Id) ?? new Place();

            existingPlace.Merge(place);

            await db.SaveChangesAsync();
        }

        public async Task<Place> GetPlaceByIdAsync(int placeId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Places.FirstOrDefaultAsync(a => a.Id == placeId) ?? new Place();
        }

        public async Task AddPlaceAsync(Place? place)
        {
            if (place == null) return;

            if (await ExistsPlaceByNameAsync(place.Name))
                return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Places.Add(place);

            await db.SaveChangesAsync();
        }

        public async Task DeletePlaceAsync(Place place)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingPlace = await db.Places.FirstOrDefaultAsync(a => a.Id == place.Id) ?? throw new Exception($"Místo {place.Name} nenalezeno");

            //activity place
            var usedInActivities = await db.Trainings.AnyAsync(a => a.Place == existingPlace);

            if (!usedInActivities)
            {
                db.Places.Remove(existingPlace);

                await db.SaveChangesAsync();
            }
        }
    }
}