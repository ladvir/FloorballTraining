using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

// Skill is fixed catalog data (seeded via SkillCategory, managed through PlayerSkillsController's
// own flows) — unlike Tag there is no inline "create a new skill" UX here, so this factory only
// resolves an existing Skill by id rather than merging editable fields onto it.
public class ActivitySkillEFCoreFactory(
    IActivitySkillRepository repository,
    IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : IActivitySkillFactory
{
    public async Task<ActivitySkill> GetMergedOrBuild(ActivitySkillDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new ActivitySkill();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivitySkill entity, ActivitySkillDto dto)
    {
        entity.Id = dto.Id;

        await using var db = await dbContextFactory.CreateDbContextAsync();
        var skill = await db.Skills.Include(s => s.SkillCategory).AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == dto.SkillId);

        entity.Skill = skill;
        entity.SkillId = skill?.Id;
        entity.ActivityId = entity.ActivityId;
    }
}
