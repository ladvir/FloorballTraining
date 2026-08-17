using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class ReportScoreWeightConfiguration : IEntityTypeConfiguration<ReportScoreWeight>
{
    public void Configure(EntityTypeBuilder<ReportScoreWeight> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.AgeGroup)
            .WithMany()
            .HasForeignKey(e => e.AgeGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.AgeGroupId).IsUnique();
    }
}
