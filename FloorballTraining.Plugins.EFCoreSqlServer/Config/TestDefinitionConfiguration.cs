using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TestDefinitionConfiguration : IEntityTypeConfiguration<TestDefinition>
{
    public void Configure(EntityTypeBuilder<TestDefinition> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.TestType).IsRequired();
        builder.Property(p => p.Category).IsRequired();
        builder.Property(p => p.Unit).HasMaxLength(20);
        builder.Property(p => p.HigherIsBetter).IsRequired();
        builder.Property(p => p.IsTemplate).IsRequired();
        builder.Property(p => p.SortOrder).IsRequired();

        builder.HasOne(t => t.Club)
            .WithMany()
            .HasForeignKey(t => t.ClubId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.ClubId);
        builder.HasIndex(t => t.Category);
    }
}
