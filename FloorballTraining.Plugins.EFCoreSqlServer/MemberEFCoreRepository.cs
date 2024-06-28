using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class MemberEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Member>(dbContextFactory), IMemberRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task UpdateMemberAsync(Member member)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingMember = await db.Members.FirstOrDefaultAsync(e => e.Id == member.Id) ?? new Member();

            existingMember.Merge(member);

            await db.SaveChangesAsync();
        }

        public async Task<Member?> GetMemberByIdAsync(int memberId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Members
                .Include(t => t.Club)
                .Include(t => t.TeamMembers)
                .ThenInclude(tp => tp.Member)
                .Include(t => t.Club)
                .ThenInclude(p => p!.Teams)
                .ThenInclude(p => p.AgeGroup)
                .FirstOrDefaultAsync(a => a.Id == memberId);
        }

        public async Task AddMemberAsync(Member? member)
        {
            if (member == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();

            if (member.Club != null)
            {
                db.Entry(member.Club).State = EntityState.Unchanged;
            }

            db.Members.Add(member);

            await db.SaveChangesAsync();
        }

        public async Task DeleteMemberAsync(Member member)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            db.Members.Remove(member);

            await db.SaveChangesAsync();
        }




    }
}