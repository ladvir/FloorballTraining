using System.Security.Claims;
using FloorballTraining.API.Controllers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Systémové šablony tréninků: CRUD, zahazování neexistujících aktivit a oprávnění
/// (vytvořit = trenérská role, upravit/smazat = autor nebo Admin, plain User nic).
/// </summary>
[Collection("Api")]
public class TrainingTemplateTests(CustomWebApplicationFactory factory)
{
    private static TrainingTemplatesController Controller(IServiceProvider sp, string userId, bool admin = false)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId) };
        if (admin) claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        return new TrainingTemplatesController(
            sp.GetRequiredService<FloorballTrainingContext>(),
            sp.GetRequiredService<UserManager<AppUser>>(),
            sp.GetRequiredService<IClubRoleService>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")),
                },
            },
        };
    }

    private async Task<string> SeedUserAsync(bool coach)
    {
        var userId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var club = new Club { Name = $"TtClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        db.Users.Add(new AppUser { Id = userId, UserName = $"u-{userId}", Email = $"{userId}@t.cz", FirstName = "Tt", LastName = "User" });
        await db.SaveChangesAsync();
        if (coach)
        {
            db.Members.Add(new Member
            {
                FirstName = "Tt", LastName = "User", BirthYear = 1990, ClubId = club.Id,
                AppUserId = userId, HasClubRoleCoach = true,
            });
            await db.SaveChangesAsync();
        }
        return userId;
    }

    private async Task<int> AnyActivityIdAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.Activities.Select(a => a.Id).FirstAsync();
    }

    private static TrainingTemplateDto Dto(string name, params int[] activityIds) => new()
    {
        Name = name,
        Parts =
        [
            new() { Name = "Rozcvička", Duration = 10, Order = 2, ActivityIds = activityIds.ToList() },
            new() { Name = "Protažení", Duration = 5, Order = 5 },
        ],
    };

    [Fact]
    public async Task Create_then_Get_returns_ordered_parts_total_duration_and_activities()
    {
        var userId = await SeedUserAsync(coach: true);
        var activityId = await AnyActivityIdAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var c = Controller(scope.ServiceProvider, userId);

        var created = ((await c.Create(Dto("Šablona A", activityId, 999_999))) as OkObjectResult)!.Value as TrainingTemplateDto;

        created!.TotalDuration.Should().Be(15);
        created.CanEdit.Should().BeTrue();
        created.Parts.Select(p => p.Order).Should().Equal(1, 2); // normalizováno
        created.Parts[0].ActivityIds.Should().Equal(activityId); // neexistující aktivita zahozena

        var fetched = ((await c.Get(created.Id)) as OkObjectResult)!.Value as TrainingTemplateDto;
        fetched!.Name.Should().Be("Šablona A");
        (await c.GetAll() as OkObjectResult)!.Value.As<List<TrainingTemplateDto>>().Should().Contain(t => t.Id == created.Id);
    }

    [Fact]
    public async Task Create_validates_name_and_parts()
    {
        var userId = await SeedUserAsync(coach: true);
        await using var scope = factory.Services.CreateAsyncScope();
        var c = Controller(scope.ServiceProvider, userId);

        (await c.Create(new TrainingTemplateDto { Name = " ", Parts = Dto("x").Parts })).Should().BeOfType<BadRequestObjectResult>();
        (await c.Create(new TrainingTemplateDto { Name = "x" })).Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task PlainUser_is_forbidden()
    {
        var userId = await SeedUserAsync(coach: false);
        await using var scope = factory.Services.CreateAsyncScope();
        var c = Controller(scope.ServiceProvider, userId);

        (await c.GetAll()).Should().BeOfType<ForbidResult>();
        (await c.Create(Dto("x"))).Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Edit_and_delete_only_by_author_or_admin()
    {
        var author = await SeedUserAsync(coach: true);
        var other = await SeedUserAsync(coach: true);
        var admin = await SeedUserAsync(coach: false);
        await using var scope = factory.Services.CreateAsyncScope();
        var sp = scope.ServiceProvider;

        var created = ((await Controller(sp, author).Create(Dto("Vlastní"))) as OkObjectResult)!.Value as TrainingTemplateDto;
        var id = created!.Id;

        // jiný trenér vidí, ale nesmí měnit
        var otherC = Controller(sp, other);
        ((await otherC.Get(id)) as OkObjectResult)!.Value.As<TrainingTemplateDto>().CanEdit.Should().BeFalse();
        (await otherC.Update(id, Dto("Cizí"))).Should().BeOfType<ForbidResult>();
        (await otherC.Delete(id)).Should().BeOfType<ForbidResult>();

        // autor edituje — části se nahradí
        var updated = ((await Controller(sp, author).Update(id, new TrainingTemplateDto
        {
            Name = "Přejmenováno",
            Parts = [new() { Name = "Jediná", Duration = 7 }],
        })) as OkObjectResult)!.Value as TrainingTemplateDto;
        updated!.Name.Should().Be("Přejmenováno");
        updated.Parts.Should().ContainSingle().Which.Name.Should().Be("Jediná");

        // admin maže (i když není autor)
        (await Controller(sp, admin, admin: true).Delete(id)).Should().BeOfType<NoContentResult>();
        (await Controller(sp, author).Get(id)).Should().BeOfType<NotFoundResult>();
    }
}
