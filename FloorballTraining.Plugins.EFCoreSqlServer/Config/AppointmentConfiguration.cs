using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Start).IsRequired();
        builder.Property(p => p.End).IsRequired();
        builder.Property(p => p.AppointmentType).IsRequired();
        builder.HasOne(a => a.Team).WithMany(a => a.Appointments).HasForeignKey(t => t.TeamId);
        builder.HasOne(a => a.Training).WithMany(a => a.Appointments).HasForeignKey(a => a.TrainingId);
        builder.HasOne(t => t.Location).WithMany(x => x.Appointments).HasForeignKey(x => x.LocationId);

        builder
            .HasMany(a => a.FutureAppointments)
            .WithOne(a => a.ParentAppointment)
            .HasForeignKey(a => a.Id);

        builder
            .HasOne(a => a.ParentAppointment)
            .WithMany(rp => rp.FutureAppointments)
            .HasForeignKey(a => a.ParentAppointmentId);

        builder
            .HasOne(a => a.RepeatingPattern)
            .WithOne(r => r.InitialAppointment)
            .HasForeignKey<RepeatingPattern>(r => r.Id);

    }
}
public class RepeatingPatternConfiguration : IEntityTypeConfiguration<RepeatingPattern>
{
    public void Configure(EntityTypeBuilder<RepeatingPattern> builder)
    {
        builder.Property(p => p.Id).IsRequired();

        builder
            .HasOne(a => a.InitialAppointment)
            .WithOne(rp => rp.RepeatingPattern)
            .HasForeignKey<RepeatingPattern>(a => a.InitialAppointmentId)
            .OnDelete(DeleteBehavior.Cascade);




    }
}