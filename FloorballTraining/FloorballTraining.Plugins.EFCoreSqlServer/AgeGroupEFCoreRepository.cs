using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class AgeGroupEFCoreRepository : GenericEFCoreRepository<AgeGroup>, IAgeGroupRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public AgeGroupEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(
            dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }
    }
}