using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class FanCheckInConfiguration : IEntityTypeConfiguration<FanCheckIn>
{
    public void Configure(EntityTypeBuilder<FanCheckIn> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.AppointmentId).IsRequired();
        builder.Property(p => p.GuardianAppUserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.CheckedInAt).IsRequired();

        builder.HasOne(e => e.Appointment)
            .WithMany()
            .HasForeignKey(e => e.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        // One check-in per guardian, child and match.
        builder.HasIndex(e => new { e.AppointmentId, e.GuardianAppUserId, e.MemberId }).IsUnique();
    }
}
