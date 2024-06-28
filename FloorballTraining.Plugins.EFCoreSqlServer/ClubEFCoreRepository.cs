using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class ClubEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Club>(dbContextFactory), IClubRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task<Club> GetClubByIdAsync(int clubId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var re = await db.Clubs.Where(a => a.Id == clubId)
                .Include(a => a.Teams).ThenInclude(t => t.AgeGroup)
                .Include(a => a.Members)
                .AsNoTracking()
                //.AsSplitQuery()
                //.AsSingleQuery()
                .FirstOrDefaultAsync();


            return re ?? new Club();

        }

        public async Task UpdateClubAsync(Club club)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingClub = await db.Clubs.FirstOrDefaultAsync(e => e.Id == club.Id) ?? new Club();

            existingClub.Merge(club);


            if (club.Members.Any())
            {
                foreach (var activityEquipment in club.Members)
                {
                    db.Entry(activityEquipment).State = EntityState.Unchanged;
                }
            }

            if (club.Teams.Any())
            {
                foreach (var activityEquipment in club.Teams)
                {
                    db.Entry(activityEquipment).State = EntityState.Unchanged;
                }
            }

            await db.SaveChangesAsync();
        }

        public async Task DeleteClubAsync(int clubId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingClub = await db.Clubs.FirstOrDefaultAsync(e => e.Id == clubId) ?? new Club();

            //activity place
            var hasAnyTeamOrMember = await db.Teams.AnyAsync(a => a.Club == existingClub)
                                     || await db.Members.AnyAsync(a => a.Club == existingClub);

            if (!hasAnyTeamOrMember)
            {
                db.Clubs.Remove(existingClub);

                await db.SaveChangesAsync();
            }
        }

        public async Task<List<Club>> GetAllSimpleAsync()
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            return await db.Clubs.ToListAsync();
        }

        public async Task AddClubAsync(Club? club)
        {
            if (club == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Clubs.Add(club);

            await db.SaveChangesAsync();
        }
    }
}