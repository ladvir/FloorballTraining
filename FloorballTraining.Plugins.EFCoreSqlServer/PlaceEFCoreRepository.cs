using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class PlaceEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Place>(dbContextFactory), IPlaceRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task UpdatePlaceAsync(Place place)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingPlace = await db.Places.FirstOrDefaultAsync(e => e.Id == place.Id) ?? new Place();

            existingPlace.Merge(place);

            await db.SaveChangesAsync();
        }

        public async Task AddPlaceAsync(Place? place)
        {
            if (place == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Places.Add(place);

            await db.SaveChangesAsync();
        }

        public async Task DeletePlaceAsync(PlaceDto place)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingPlace = await db.Places.FirstOrDefaultAsync(a => a.Id == place.Id) ?? throw new Exception($"Místo {place.Name} nenalezeno");

            var usedInAppointments = await db.Appointments.AnyAsync(a => a.Location == existingPlace);

            if (!usedInAppointments)
            {
                db.Places.Remove(existingPlace);

                await db.SaveChangesAsync();
            }
        }


    }
}