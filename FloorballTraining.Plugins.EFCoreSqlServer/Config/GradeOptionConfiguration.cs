using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class GradeOptionConfiguration : IEntityTypeConfiguration<GradeOption>
{
    public void Configure(EntityTypeBuilder<GradeOption> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Label).IsRequired().HasMaxLength(100);
        builder.Property(p => p.NumericValue).IsRequired();
        builder.Property(p => p.Colour).HasMaxLength(10);
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasOne(g => g.TestDefinition)
            .WithMany(t => t.GradeOptions)
            .HasForeignKey(g => g.TestDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(g => g.TestDefinitionId);
    }
}
