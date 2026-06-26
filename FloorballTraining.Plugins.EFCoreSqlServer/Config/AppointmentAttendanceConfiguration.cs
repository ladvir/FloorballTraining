using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AppointmentAttendanceConfiguration : IEntityTypeConfiguration<AppointmentAttendance>
{
    public void Configure(EntityTypeBuilder<AppointmentAttendance> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.AppointmentId).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Status).IsRequired();
        builder.Property(p => p.Note).HasMaxLength(500);
        builder.Property(p => p.RecordedByUserId).HasMaxLength(450);
        builder.Property(p => p.RecordedAt).IsRequired();

        builder.HasOne(a => a.Appointment)
            .WithMany(a => a.Attendances)
            .HasForeignKey(a => a.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Member)
            .WithMany()
            .HasForeignKey(a => a.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => new { a.AppointmentId, a.MemberId }).IsUnique();
    }
}
