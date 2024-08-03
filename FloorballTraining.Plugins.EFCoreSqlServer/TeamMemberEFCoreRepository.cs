using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TeamMemberEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<TeamMember>(dbContextFactory), ITeamMemberRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;


        public async Task UpdateTeamMemberAsync(TeamMember member)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingMember = await db.TeamMembers.FirstOrDefaultAsync(e => e.Id == member.Id) ?? new TeamMember();

            existingMember.Merge(member);

            await db.SaveChangesAsync();
        }

        public async Task AddTeamMemberAsync(TeamMember member)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            if (member.Team != null)
            {
                db.Entry(member.Team).State = EntityState.Unchanged;
            }

            if (member.Member != null)
            {
                db.Entry(member.Member).State = EntityState.Unchanged;
            }

            db.TeamMembers.Add(member);

            await db.SaveChangesAsync();
        }

        public async Task DeleteTeamMemberAsync(TeamMember member)
        {

            await using var db = await _dbContextFactory.CreateDbContextAsync();

            db.TeamMembers.Remove(member);

            await db.SaveChangesAsync();
        }
    }
}