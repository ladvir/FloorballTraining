using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AppointmentTestDefinitionConfiguration : IEntityTypeConfiguration<AppointmentTestDefinition>
{
    public void Configure(EntityTypeBuilder<AppointmentTestDefinition> builder)
    {
        builder.Property(p => p.Id).IsRequired();

        builder.HasOne(x => x.Appointment)
            .WithMany(a => a.AppointmentTestDefinitions)
            .HasForeignKey(x => x.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TestDefinition)
            .WithMany()
            .HasForeignKey(x => x.TestDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.AppointmentId);
        builder.HasIndex(x => new { x.AppointmentId, x.TestDefinitionId }).IsUnique();
    }
}
