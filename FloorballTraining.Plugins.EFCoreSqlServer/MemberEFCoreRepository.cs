using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
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

        public async Task AddMemberAsync(Member? member)
        {
            if (member == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Members.Add(member);

            await db.SaveChangesAsync();
        }

        public async Task DeleteMemberAsync(Member member)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            db.Members.Remove(member);

            await db.SaveChangesAsync();
        }

        public async Task DeleteMemberAsync(MemberDto member)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingMember = await db.Members.FirstOrDefaultAsync(a => a.Id == member.Id) ?? throw new Exception($"Klub {member.Name} nenalezen");

            //todo
            //var usedInActivities = await db.Trainings.AnyAsync(a => a.Member == existingMember);

            //if (!usedInActivities)
            //{
            //    db.Members.Remove(existingMember);

            //    await db.SaveChangesAsync();
            //}
        }


    }
}