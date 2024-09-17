using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class RepeatingPatternEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : GenericEFCoreRepository<RepeatingPattern>(dbContextFactory), IRepeatingPatternRepository;