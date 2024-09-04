using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();
        builder.Property(p => p.Start).IsRequired();
        builder.Property(p => p.Duration).IsRequired();
        builder.Property(p => p.AppointmentType).IsRequired();
        builder.Property(p => p.Name).IsRequired();
        builder.HasOne(a => a.Team).WithMany(a => a.Appointments).IsRequired();
        builder.HasOne(a => a.Training).WithMany(a => a.Appointments).HasForeignKey(a => a.TrainingId);
    }
}