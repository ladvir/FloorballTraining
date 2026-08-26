using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivitySkillEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : GenericEFCoreRepository<ActivitySkill>(dbContextFactory), IActivitySkillRepository;
