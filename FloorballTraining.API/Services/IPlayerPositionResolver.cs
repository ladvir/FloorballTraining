using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Resolves which skill-category position (FieldPlayer/Goalkeeper) applies to a member.
/// #91 will add an explicit, coach-editable field on Member as the primary source of
/// truth; this lineup-inferred resolver is the fallback (and, until #91 lands, the
/// only implementation) — kept behind this interface so that swap is additive.
/// </summary>
public interface IPlayerPositionResolver
{
    Task<SkillCategoryPosition> ResolveAsync(int memberId);
}

/// <summary>Infers position from the member's most frequent lineup slot (same logic as MemberReportController).</summary>
public class LineupInferredPlayerPositionResolver(FloorballTrainingContext context) : IPlayerPositionResolver
{
    public async Task<SkillCategoryPosition> ResolveAsync(int memberId)
    {
        var position = await context.LineupSlots
            .Where(s => s.Roster != null && s.Roster.MemberId == memberId)
            .GroupBy(s => s.Position)
            .OrderByDescending(g => g.Count())
            .Select(g => (SlotPosition?)g.Key)
            .FirstOrDefaultAsync();

        return position == SlotPosition.Goalie ? SkillCategoryPosition.Goalkeeper : SkillCategoryPosition.FieldPlayer;
    }
}
