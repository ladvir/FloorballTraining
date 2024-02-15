using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.Property(p => p.Id).IsRequired();

        builder.HasMany(a => a.ActivityTags).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);
        builder.HasMany(a => a.ActivityEquipments).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);
        builder.HasMany(a => a.ActivityMedium).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);

        builder.HasMany(a => a.ActivityAgeGroups).WithOne(a => a.Activity).HasForeignKey(t => t.ActivityId);
    }
}