using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class FormationTemplateConfiguration : IEntityTypeConfiguration<FormationTemplate>
{
    public void Configure(EntityTypeBuilder<FormationTemplate> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.FormationSize).IsRequired();
        builder.Property(p => p.IncludesGoalie).IsRequired();
        builder.Property(p => p.IsBuiltIn).IsRequired();

        builder.HasOne(t => t.Club)
            .WithMany()
            .HasForeignKey(t => t.ClubId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired(false);

        builder.HasMany(t => t.Slots)
            .WithOne(s => s.FormationTemplate)
            .HasForeignKey(s => s.FormationTemplateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FormationTemplateSlotConfiguration : IEntityTypeConfiguration<FormationTemplateSlot>
{
    public void Configure(EntityTypeBuilder<FormationTemplateSlot> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.FormationTemplateId).IsRequired();
        builder.Property(p => p.Position).IsRequired();
        builder.Property(p => p.X).IsRequired();
        builder.Property(p => p.Y).IsRequired();
        builder.Property(p => p.SortOrder).IsRequired();
    }
}

public class MatchLineupConfiguration : IEntityTypeConfiguration<MatchLineup>
{
    public void Configure(EntityTypeBuilder<MatchLineup> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TeamId).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.FormationTemplateId).IsRequired();
        builder.Property(p => p.FormationCount).IsRequired();
        builder.Property(p => p.IsShared).IsRequired();
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired();

        builder.HasOne(l => l.Team)
            .WithMany()
            .HasForeignKey(l => l.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Appointment)
            .WithMany()
            .HasForeignKey(l => l.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(l => l.FormationTemplate)
            .WithMany()
            .HasForeignKey(l => l.FormationTemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(l => l.Roster)
            .WithOne(r => r.MatchLineup)
            .HasForeignKey(r => r.MatchLineupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.Formations)
            .WithOne(f => f.MatchLineup)
            .HasForeignKey(f => f.MatchLineupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.AppointmentId);
        builder.HasIndex(l => l.TeamId);
    }
}

public class LineupRosterConfiguration : IEntityTypeConfiguration<LineupRoster>
{
    public void Configure(EntityTypeBuilder<LineupRoster> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MatchLineupId).IsRequired();
        builder.Property(p => p.ManualName).HasMaxLength(200);
        builder.Property(p => p.IsAvailable).IsRequired();
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasOne(r => r.Member)
            .WithMany()
            .HasForeignKey(r => r.MemberId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);
    }
}

public class LineupFormationConfiguration : IEntityTypeConfiguration<LineupFormation>
{
    public void Configure(EntityTypeBuilder<LineupFormation> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MatchLineupId).IsRequired();
        builder.Property(p => p.Index).IsRequired();
        builder.Property(p => p.Label).HasMaxLength(50);
        builder.Property(p => p.ColorKey).IsRequired().HasMaxLength(20);

        builder.HasMany(f => f.Slots)
            .WithOne(s => s.LineupFormation)
            .HasForeignKey(s => s.LineupFormationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LineupSlotConfiguration : IEntityTypeConfiguration<LineupSlot>
{
    public void Configure(EntityTypeBuilder<LineupSlot> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.LineupFormationId).IsRequired();
        builder.Property(p => p.Position).IsRequired();

        builder.HasOne(s => s.Roster)
            .WithMany()
            .HasForeignKey(s => s.RosterId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);
    }
}
