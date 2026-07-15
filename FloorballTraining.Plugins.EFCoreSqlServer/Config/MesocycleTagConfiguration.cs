using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MesocycleTagConfiguration : IEntityTypeConfiguration<MesocycleTag>
{
    public void Configure(EntityTypeBuilder<MesocycleTag> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasOne(e => e.Mesocycle)
            .WithMany(m => m.GoalTags)
            .HasForeignKey(e => e.MesocycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Tag)
            .WithMany()
            .HasForeignKey(e => e.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.MesocycleId, e.TagId }).IsUnique();
    }
}
