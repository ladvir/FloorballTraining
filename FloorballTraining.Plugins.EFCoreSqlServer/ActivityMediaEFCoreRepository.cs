using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivityMediaEFCoreRepository : GenericEFCoreRepository<ActivityMedia>, IActivityMediaRepository
{
    public ActivityMediaEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(
        dbContextFactory)
    {

    }
}