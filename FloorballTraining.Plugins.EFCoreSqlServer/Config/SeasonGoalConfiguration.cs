using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class SeasonGoalConfiguration : IEntityTypeConfiguration<SeasonGoal>
{
    public void Configure(EntityTypeBuilder<SeasonGoal> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Note).HasMaxLength(500);
        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.Season)
            .WithMany()
            .HasForeignKey(e => e.SeasonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Team)
            .WithMany()
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.TestDefinition)
            .WithMany()
            .HasForeignKey(e => e.TestDefinitionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(e => new { e.SeasonId, e.TeamId });
    }
}
