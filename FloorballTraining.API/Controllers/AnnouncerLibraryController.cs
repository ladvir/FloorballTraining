using System.Security.Claims;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Per-user Hlasatel (announcer) library — saved announcements, replacing the old browser-only
/// localStorage list so it follows the user across devices. Every row is scoped to the caller;
/// there is no sharing and no role gate beyond being signed in.
/// </summary>
[Authorize]
public class AnnouncerLibraryController(FloorballTrainingContext context) : BaseApiController
{
    public record ItemDto(int Id, string Name, string Text, DateTime CreatedAt);
    public record SaveRequest(string Name, string Text);

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<ItemDto>>> GetMine()
    {
        var items = await context.AnnouncerLibraryItems
            .Where(i => i.UserId == UserId)
            .OrderBy(i => i.CreatedAt)
            .Select(i => new ItemDto(i.Id, i.Name, i.Text, i.CreatedAt))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<ItemDto>> Create(SaveRequest req)
    {
        var name = (req.Name ?? "").Trim();
        var text = (req.Text ?? "").Trim();
        if (name.Length == 0 || text.Length == 0) return BadRequest("Name and text are required.");
        if (name.Length > 120) name = name[..120];
        if (text.Length > 4000) text = text[..4000];

        var item = new AnnouncerLibraryItem { UserId = UserId, Name = name, Text = text };
        context.AnnouncerLibraryItems.Add(item);
        await context.SaveChangesAsync();
        return Ok(new ItemDto(item.Id, item.Name, item.Text, item.CreatedAt));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await context.AnnouncerLibraryItems
            .Where(i => i.Id == id && i.UserId == UserId)
            .ExecuteDeleteAsync();
        return deleted == 0 ? NotFound() : NoContent();
    }
}
