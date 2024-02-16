using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivityAgeGroupEFCoreRepository : GenericEFCoreRepository<ActivityAgeGroup>, IActivityAgeGroupRepository
{
    public ActivityAgeGroupEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(
        dbContextFactory)
    {

    }
}