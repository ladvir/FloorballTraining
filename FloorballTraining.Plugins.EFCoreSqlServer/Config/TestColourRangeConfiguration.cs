using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TestColourRangeConfiguration : IEntityTypeConfiguration<TestColourRange>
{
    public void Configure(EntityTypeBuilder<TestColourRange> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TestDefinitionId).IsRequired();

        builder.HasOne(c => c.TestDefinition)
            .WithMany(t => t.ColourRanges)
            .HasForeignKey(c => c.TestDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.AgeGroup)
            .WithMany()
            .HasForeignKey(c => c.AgeGroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => new { c.TestDefinitionId, c.AgeGroupId, c.Gender }).IsUnique();
    }
}
