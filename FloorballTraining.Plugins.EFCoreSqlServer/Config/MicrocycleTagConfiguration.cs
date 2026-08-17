using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MicrocycleTagConfiguration : IEntityTypeConfiguration<MicrocycleTag>
{
    public void Configure(EntityTypeBuilder<MicrocycleTag> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasOne(e => e.Microcycle)
            .WithMany(m => m.GoalTags)
            .HasForeignKey(e => e.MicrocycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Tag)
            .WithMany()
            .HasForeignKey(e => e.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.MicrocycleId, e.TagId }).IsUnique();
    }
}
