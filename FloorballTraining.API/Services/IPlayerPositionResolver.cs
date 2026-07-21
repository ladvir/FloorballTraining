using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Resolves which skill-category position(s) (FieldPlayer/Goalkeeper) apply to a member's
/// skill card. Returns more than one entry only when the member's explicit role is "Both".
/// </summary>
public interface IPlayerPositionResolver
{
    Task<IReadOnlyList<SkillCategoryPosition>> ResolveAsync(int memberId);
}

/// <summary>Infers position from the member's most frequent lineup slot (same logic as MemberReportController). Used as the fallback when no explicit MemberPlayerRole is set.</summary>
public class LineupInferredPlayerPositionResolver(FloorballTrainingContext context) : IPlayerPositionResolver
{
    public async Task<IReadOnlyList<SkillCategoryPosition>> ResolveAsync(int memberId)
    {
        var position = await context.LineupSlots
            .Where(s => s.Roster != null && s.Roster.MemberId == memberId)
            .GroupBy(s => s.Position)
            .OrderByDescending(g => g.Count())
            .Select(g => (SlotPosition?)g.Key)
            .FirstOrDefaultAsync();

        return [position == SlotPosition.Goalie ? SkillCategoryPosition.Goalkeeper : SkillCategoryPosition.FieldPlayer];
    }
}

/// <summary>
/// Primary resolver (#91): reads the member's explicit MemberPlayerRole first — the coach-editable
/// source of truth. Falls back to lineup inference only when no role has been set yet.
/// </summary>
public class MemberRolePositionResolver(FloorballTrainingContext context, LineupInferredPlayerPositionResolver fallback)
    : IPlayerPositionResolver
{
    public async Task<IReadOnlyList<SkillCategoryPosition>> ResolveAsync(int memberId)
    {
        var role = await context.MemberPlayerRoles.AsNoTracking()
            .FirstOrDefaultAsync(r => r.MemberId == memberId);

        if (role == null) return await fallback.ResolveAsync(memberId);

        return role.Position switch
        {
            MemberSkillPosition.Both => [SkillCategoryPosition.FieldPlayer, SkillCategoryPosition.Goalkeeper],
            MemberSkillPosition.Goalkeeper => [SkillCategoryPosition.Goalkeeper],
            _ => [SkillCategoryPosition.FieldPlayer],
        };
    }
}
