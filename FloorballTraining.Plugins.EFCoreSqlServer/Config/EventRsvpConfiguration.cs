using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class EventRsvpConfiguration : IEntityTypeConfiguration<EventRsvp>
{
    public void Configure(EntityTypeBuilder<EventRsvp> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.AppointmentId).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Status).IsRequired();
        builder.Property(p => p.Note).HasMaxLength(500);

        builder.HasOne(r => r.Appointment)
            .WithMany()
            .HasForeignKey(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Member)
            .WithMany()
            .HasForeignKey(r => r.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.AppointmentId, r.MemberId }).IsUnique();
        builder.HasIndex(r => r.AppointmentId);
    }
}
