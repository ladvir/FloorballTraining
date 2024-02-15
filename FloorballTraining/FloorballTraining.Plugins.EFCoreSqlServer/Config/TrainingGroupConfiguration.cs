using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TrainingGroupConfiguration : IEntityTypeConfiguration<TrainingGroup>
{
    public void Configure(EntityTypeBuilder<TrainingGroup> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.HasOne(t => t.TrainingPart).WithMany(at => at.TrainingGroups).HasForeignKey(x => x.TrainingPartId);
    }
}