using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class HomeTrainingLogConfiguration : IEntityTypeConfiguration<HomeTrainingLog>
{
    public void Configure(EntityTypeBuilder<HomeTrainingLog> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Note).HasMaxLength(1000);
        builder.Property(p => p.ConfirmedByUserId).HasMaxLength(450);
        builder.Property(p => p.LoggedAt).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.Training)
            .WithMany()
            .HasForeignKey(e => e.TrainingId)
            .OnDelete(DeleteBehavior.SetNull);

        // The personal calendar event is disposable — clearing the FK (not cascading) when it goes.
        builder.HasOne(e => e.Appointment)
            .WithMany()
            .HasForeignKey(e => e.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Multiple logs per day are allowed (#104 update — capped by daily XP instead). Non-unique
        // index still speeds the per-member/day lookups the derivation and confirm queue do.
        builder.HasIndex(e => new { e.MemberId, e.LoggedAt });
    }
}
