using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AppointmentMemberAssignmentConfiguration : IEntityTypeConfiguration<AppointmentMemberAssignment>
{
    public void Configure(EntityTypeBuilder<AppointmentMemberAssignment> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasOne(e => e.Appointment)
            .WithMany(a => a.MemberAssignments)
            .HasForeignKey(e => e.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.AppointmentId, e.MemberId }).IsUnique();
    }
}
