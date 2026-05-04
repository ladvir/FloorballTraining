using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TournamentConfiguration : IEntityTypeConfiguration<Tournament>
{
    public void Configure(EntityTypeBuilder<Tournament> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Format).IsRequired().HasMaxLength(40);
        builder.Property(p => p.SpecialGoalBonusPoints).IsRequired();
        builder.Property(p => p.FieldsJson).IsRequired();
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired();

        builder.HasOne(t => t.Club)
            .WithMany()
            .HasForeignKey(t => t.ClubId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasMany(t => t.Teams)
            .WithOne(x => x.Tournament)
            .HasForeignKey(x => x.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.SpecialTasks)
            .WithOne(x => x.Tournament)
            .HasForeignKey(x => x.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Matches)
            .WithOne(x => x.Tournament)
            .HasForeignKey(x => x.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.ClubId);
    }
}

public class TournamentTeamConfiguration : IEntityTypeConfiguration<TournamentTeam>
{
    public void Configure(EntityTypeBuilder<TournamentTeam> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TournamentId).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasIndex(t => t.TournamentId);
    }
}

public class TournamentSpecialTaskConfiguration : IEntityTypeConfiguration<TournamentSpecialTask>
{
    public void Configure(EntityTypeBuilder<TournamentSpecialTask> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TournamentId).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.BonusPoints).IsRequired();

        builder.HasIndex(t => t.TournamentId);
    }
}

public class TournamentMatchConfiguration : IEntityTypeConfiguration<TournamentMatch>
{
    public void Configure(EntityTypeBuilder<TournamentMatch> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TournamentId).IsRequired();
        builder.Property(p => p.Round).IsRequired();
        builder.Property(p => p.Stage).IsRequired().HasMaxLength(8);
        builder.Property(p => p.Field).HasMaxLength(80);
        builder.Property(p => p.Played).IsRequired();
        builder.Property(p => p.HomeGoals).IsRequired();
        builder.Property(p => p.AwayGoals).IsRequired();
        builder.Property(p => p.HomeSpecialGoals).IsRequired();
        builder.Property(p => p.AwaySpecialGoals).IsRequired();

        builder.HasOne(m => m.HomeTeam)
            .WithMany()
            .HasForeignKey(m => m.HomeTeamId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);

        builder.HasOne(m => m.AwayTeam)
            .WithMany()
            .HasForeignKey(m => m.AwayTeamId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);

        builder.HasMany(m => m.TaskCompletions)
            .WithOne(x => x.TournamentMatch)
            .HasForeignKey(x => x.TournamentMatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TournamentId);
    }
}

public class TournamentMatchTaskCompletionConfiguration : IEntityTypeConfiguration<TournamentMatchTaskCompletion>
{
    public void Configure(EntityTypeBuilder<TournamentMatchTaskCompletion> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TournamentMatchId).IsRequired();
        builder.Property(p => p.TournamentSpecialTaskId).IsRequired();
        builder.Property(p => p.IsHome).IsRequired();

        builder.HasOne(c => c.TournamentSpecialTask)
            .WithMany()
            .HasForeignKey(c => c.TournamentSpecialTaskId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(t => t.TournamentMatchId);
        builder.HasIndex(t => t.TournamentSpecialTaskId);
    }
}
