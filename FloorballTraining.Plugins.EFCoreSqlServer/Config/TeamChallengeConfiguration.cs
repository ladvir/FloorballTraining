using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TeamChallengeConfiguration : IEntityTypeConfiguration<TeamChallenge>
{
    public void Configure(EntityTypeBuilder<TeamChallenge> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Description).HasMaxLength(1000);
        builder.Property(e => e.IsActive).IsRequired();
        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.Team)
            .WithMany()
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.TeamId, e.IsActive });
    }
}

public class TeamChallengeCompletionConfiguration : IEntityTypeConfiguration<TeamChallengeCompletion>
{
    public void Configure(EntityTypeBuilder<TeamChallengeCompletion> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.PeriodKey).IsRequired().HasMaxLength(20);
        builder.Property(e => e.CompletedAt).IsRequired();
        builder.Property(e => e.CompletedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.TeamChallenge)
            .WithMany()
            .HasForeignKey(e => e.TeamChallengeId)
            .OnDelete(DeleteBehavior.Cascade);

        // NoAction: TeamChallenge already cascades from Team; a second cascade path via Member would be a
        // multiple-cascade-path error on SQL Server. Orphan rows for a deleted member are pruned by the recompute.
        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        // Idempotence: one completion per (team challenge, member, window).
        builder.HasIndex(e => new { e.TeamChallengeId, e.MemberId, e.PeriodKey }).IsUnique();
    }
}
