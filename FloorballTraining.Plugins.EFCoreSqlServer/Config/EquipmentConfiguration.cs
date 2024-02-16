using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> builder)
    {
        builder.Property(p => p.Id).IsRequired();

        builder.HasMany(t => t.ActivityEquipments).WithOne(at => at.Equipment).HasForeignKey(a => a.EquipmentId);
    }
}