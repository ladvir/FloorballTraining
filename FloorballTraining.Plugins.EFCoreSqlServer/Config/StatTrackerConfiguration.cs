using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class StatTrackerConfiguration : IEntityTypeConfiguration<StatTracker>
{
    public void Configure(EntityTypeBuilder<StatTracker> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.EventCategory).IsRequired();
        builder.Property(p => p.TeamId).IsRequired();
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired();
        builder.Property(p => p.OpponentName).HasMaxLength(120);

        builder.HasOne(s => s.Team)
            .WithMany()
            .HasForeignKey(s => s.TeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(s => s.Season)
            .WithMany()
            .HasForeignKey(s => s.SeasonId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.TournamentMatch)
            .WithMany()
            .HasForeignKey(s => s.TournamentMatchId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.Appointment)
            .WithMany()
            .HasForeignKey(s => s.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.MatchLineup)
            .WithMany()
            .HasForeignKey(s => s.MatchLineupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(s => s.Participants)
            .WithOne(p => p.StatTracker)
            .HasForeignKey(p => p.StatTrackerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Metrics)
            .WithOne(m => m.StatTracker)
            .HasForeignKey(m => m.StatTrackerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Entries)
            .WithOne(e => e.StatTracker)
            .HasForeignKey(e => e.StatTrackerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.TeamId);
        builder.HasIndex(s => s.TournamentMatchId);
        builder.HasIndex(s => s.AppointmentId);
        builder.HasIndex(s => new { s.TeamId, s.SeasonId, s.EventCategory });
    }
}

public class StatTrackerParticipantConfiguration : IEntityTypeConfiguration<StatTrackerParticipant>
{
    public void Configure(EntityTypeBuilder<StatTrackerParticipant> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.StatTrackerId).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Role).IsRequired();
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasOne(p => p.Member)
            .WithMany()
            .HasForeignKey(p => p.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(p => p.StatTrackerId);
        builder.HasIndex(p => p.MemberId);
    }
}

public class StatTrackerMetricConfiguration : IEntityTypeConfiguration<StatTrackerMetric>
{
    public void Configure(EntityTypeBuilder<StatTrackerMetric> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.StatTrackerId).IsRequired();
        builder.Property(p => p.Code).IsRequired().HasMaxLength(40);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(80);
        builder.Property(p => p.IsGoalkeeper).IsRequired();
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasIndex(p => p.StatTrackerId);
    }
}

public class StatTrackerEntryConfiguration : IEntityTypeConfiguration<StatTrackerEntry>
{
    public void Configure(EntityTypeBuilder<StatTrackerEntry> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.StatTrackerId).IsRequired();
        builder.Property(p => p.Kind).IsRequired();
        builder.Property(p => p.Delta).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(e => e.Participant)
            .WithMany()
            .HasForeignKey(e => e.StatTrackerParticipantId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);

        builder.HasOne(e => e.Metric)
            .WithMany()
            .HasForeignKey(e => e.StatTrackerMetricId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);

        builder.HasIndex(p => p.StatTrackerId);
        builder.HasIndex(p => new { p.StatTrackerId, p.CreatedAt });
    }
}

public class TeamStatMetricTemplateConfiguration : IEntityTypeConfiguration<TeamStatMetricTemplate>
{
    public void Configure(EntityTypeBuilder<TeamStatMetricTemplate> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TeamId).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(80);
        builder.Property(p => p.IsGoalkeeper).IsRequired();
        builder.Property(p => p.AppliesTo).IsRequired().HasMaxLength(20);
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasOne(t => t.Team)
            .WithMany()
            .HasForeignKey(t => t.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TeamId);
    }
}
