using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AgeGroupConfiguration : IEntityTypeConfiguration<AgeGroup>
{
    public void Configure(EntityTypeBuilder<AgeGroup> builder)
    {
        builder.Property(p => p.Id).IsRequired();

        builder.HasMany(t => t.ActivityAgeGroups).WithOne(at => at.AgeGroup).HasForeignKey(a => a.AgeGroupId);
        builder.HasMany(t => t.TrainingAgeGroups).WithOne(at => at.AgeGroup).HasForeignKey(a => a.AgeGroupId);
    }
}