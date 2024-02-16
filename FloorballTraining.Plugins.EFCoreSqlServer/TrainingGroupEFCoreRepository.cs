using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class TrainingGroupEFCoreRepository : GenericEFCoreRepository<TrainingGroup>, ITrainingGroupRepository
{

    public TrainingGroupEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(
        dbContextFactory)
    {

    }
}