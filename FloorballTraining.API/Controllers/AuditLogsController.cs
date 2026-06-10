using FloorballTraining.API.Dtos.Audit;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize(Roles = "Admin")]
public class AuditLogsController(FloorballTrainingContext context) : BaseApiController
{
    // GET /auditlogs?userEmail=&action=&entityType=&from=&to=&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> Get(
        [FromQuery] string? userId,
        [FromQuery] string? userEmail,
        [FromQuery] string? action,
        [FromQuery] string? entityType,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        page = page < 1 ? 1 : page;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = context.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(a => a.UserId == userId);
        if (!string.IsNullOrWhiteSpace(userEmail))
            query = query.Where(a => a.UserEmail != null && a.UserEmail.Contains(userEmail));
        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action == action);
        if (!string.IsNullOrWhiteSpace(entityType))
            query = query.Where(a => a.EntityType == entityType);
        if (from.HasValue)
            query = query.Where(a => a.OccurredAt >= from.Value);
        if (to.HasValue)
            query = query.Where(a => a.OccurredAt <= to.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserEmail = a.UserEmail,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                Details = a.Details,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                OccurredAt = a.OccurredAt
            })
            .ToListAsync();

        return new PagedResult<AuditLogDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
