using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TrainingPartConfiguration : IEntityTypeConfiguration<TrainingPart>
{
    public void Configure(EntityTypeBuilder<TrainingPart> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();

        builder.HasMany(t => t.TrainingGroups).WithOne(a => a.TrainingPart).HasForeignKey(a => a.TrainingPartId);
        builder.HasOne(t => t.Training).WithMany(a => a.TrainingParts).HasForeignKey(a => a.TrainingId);
    }
}