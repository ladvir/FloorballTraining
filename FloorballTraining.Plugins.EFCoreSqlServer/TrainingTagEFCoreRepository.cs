using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class TrainingTagEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : GenericEFCoreRepository<TrainingTag>(dbContextFactory), ITrainingTagRepository;
