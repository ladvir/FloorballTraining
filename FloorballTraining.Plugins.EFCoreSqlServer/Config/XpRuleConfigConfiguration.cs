using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class XpRuleConfigConfiguration : IEntityTypeConfiguration<XpRuleConfig>
{
    public void Configure(EntityTypeBuilder<XpRuleConfig> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.Club)
            .WithMany()
            .HasForeignKey(e => e.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Team)
            .WithMany()
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.NoAction);

        // One row per (club, team-or-club-wide, event type). HasFilter(null) overrides EF's default
        // "[TeamId] IS NOT NULL" filter so club-wide rows (TeamId NULL) are covered too — SQL Server treats
        // NULLs as equal in a unique index, giving exactly one club-wide override per (club, event type).
        builder.HasIndex(e => new { e.ClubId, e.TeamId, e.EventType }).IsUnique().HasFilter(null);
    }
}
