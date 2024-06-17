using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class TrainingGroupEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : GenericEFCoreRepository<TrainingGroup>(dbContextFactory), ITrainingGroupRepository;