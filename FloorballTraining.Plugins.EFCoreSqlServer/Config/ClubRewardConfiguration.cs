using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class ClubRewardConfiguration : IEntityTypeConfiguration<ClubReward>
{
    public void Configure(EntityTypeBuilder<ClubReward> builder)
    {
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(1000);
        builder.Property(p => p.TriggerValue).IsRequired().HasMaxLength(50);
        builder.Property(p => p.TriggerType).IsRequired();
        builder.Property(p => p.IsActive).IsRequired();

        builder.HasOne(e => e.Club)
            .WithMany()
            .HasForeignKey(e => e.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

        // NoAction: Club already cascades to its rewards; a second cascade path via Team would be a
        // multiple-cascade-path error on SQL Server. Deleting a team with rewards is a rare admin action.
        builder.HasOne(e => e.Team)
            .WithMany()
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(e => new { e.ClubId, e.TeamId });
    }
}
