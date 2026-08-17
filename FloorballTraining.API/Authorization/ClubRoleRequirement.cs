using FloorballTraining.API.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FloorballTraining.API.Authorization;

/// <summary>
/// Policy names for effective-role authorization.
/// Use these constants with [Authorize(Policy = "...")] or policy builders.
/// </summary>
public static class Policies
{
    public const string MinCoach     = "MinCoach";
    public const string MinHeadCoach = "MinHeadCoach";
    public const string MinClubAdmin = "MinClubAdmin";
    public const string AdminOnly    = "AdminOnly";
}

/// <summary>
/// Authorization requirement satisfied when the current user's effective club
/// role (from <see cref="IClubRoleService"/>) is at least <see cref="MinimumRole"/>.
///
/// Role hierarchy (ascending): User &lt; Coach &lt; HeadCoach &lt; ClubAdmin &lt; Admin
/// </summary>
public sealed class ClubRoleRequirement : IAuthorizationRequirement
{
    private static readonly string[] Hierarchy =
        ["User", "Coach", "HeadCoach", "ClubAdmin", "Admin"];

    private readonly int _minIdx;

    public ClubRoleRequirement(string minimumRole)
    {
        _minIdx = Array.IndexOf(Hierarchy, minimumRole);
        if (_minIdx == -1)
            throw new ArgumentException(
                $"Unknown role '{minimumRole}'. Valid roles: {string.Join(", ", Hierarchy)}",
                nameof(minimumRole));
        MinimumRole = minimumRole;
    }

    public string MinimumRole { get; }

    public bool IsSatisfiedBy(string effectiveRole)
    {
        var roleIdx = Array.IndexOf(Hierarchy, effectiveRole);
        return roleIdx >= _minIdx;
    }
}

/// <summary>
/// Resolves the current user's effective role via <see cref="IClubRoleService"/>
/// and checks it against the <see cref="ClubRoleRequirement"/>.
/// </summary>
public sealed class ClubRoleHandler(IClubRoleService clubRoleService)
    : AuthorizationHandler<ClubRoleRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ClubRoleRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            // Do not call context.Fail() — let the framework issue 401 Unauthorized
            // for unauthenticated callers via the JWT challenge mechanism.
            return;
        }

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (requirement.IsSatisfiedBy(roleInfo.EffectiveRole))
            context.Succeed(requirement);
        else
            context.Fail();
    }
}
