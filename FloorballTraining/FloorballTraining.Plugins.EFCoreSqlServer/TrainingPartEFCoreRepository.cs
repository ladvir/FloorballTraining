using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class TrainingPartEFCoreRepository : GenericEFCoreRepository<TrainingPart>, ITrainingPartRepository
{
    public TrainingPartEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(
        dbContextFactory)
    {

    }
}