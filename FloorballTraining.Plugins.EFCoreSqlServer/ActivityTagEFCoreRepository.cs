using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivityTagEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : GenericEFCoreRepository<ActivityTag>(dbContextFactory), IActivityTagRepository;