using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class ClubEFCoreRepository : GenericEFCoreRepository<Club>, IClubRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public ClubEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }

        public async Task UpdateClubAsync(Club club)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingClub = await db.Clubs.FirstOrDefaultAsync(e => e.Id == club.Id) ?? new Club();

            existingClub.Merge(club);

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

        public async Task AddClubAsync(Club? club)
        {
            if (club == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Clubs.Add(club);

            await db.SaveChangesAsync();
        }
    }
}