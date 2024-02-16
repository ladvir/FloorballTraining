using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivityEquipmentEFCoreRepository : GenericEFCoreRepository<ActivityEquipment>, IActivityEquipmentRepository
{
    public ActivityEquipmentEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(
        dbContextFactory)
    {

    }
}