using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// EF Core 9+ throws on MigrateAsync() (production startup + deploy) when the model differs from
/// the migrations snapshot. This catches a forgotten "migrations add" in CI instead of in production.
/// </summary>
public class ModelSnapshotTests
{
    [Fact]
    public void Model_HasNoPendingChanges_ComparedToMigrationSnapshot()
    {
        // SqlServer provider (as in production); no connection is opened by HasPendingModelChanges.
        var options = new DbContextOptionsBuilder<FloorballTrainingContext>()
            .UseSqlServer("Server=.;Database=ignored;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        using var context = new FloorballTrainingContext(options);

        context.Database.HasPendingModelChanges().Should().BeFalse(
            "run `dotnet ef migrations add` for the model change");
    }
}
