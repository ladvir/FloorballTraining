using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class AgeGroupEFCoreRepository : IAgeGroupRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public AgeGroupEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }


        public async Task<IEnumerable<AgeGroup>> GetAgeGroupsByNameAsync(string searchString = "")
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.AgeGroups.Where(ag => string.IsNullOrWhiteSpace(searchString) || ag.Name.ToLower().Contains(searchString.ToLower())).ToListAsync();
        }
    }
}