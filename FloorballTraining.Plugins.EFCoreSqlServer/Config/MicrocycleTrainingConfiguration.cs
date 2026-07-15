using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MicrocycleTrainingConfiguration : IEntityTypeConfiguration<MicrocycleTraining>
{
    public void Configure(EntityTypeBuilder<MicrocycleTraining> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Note).HasMaxLength(500);

        builder.HasOne(e => e.Microcycle)
            .WithMany(m => m.RecommendedTrainings)
            .HasForeignKey(e => e.MicrocycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Training)
            .WithMany()
            .HasForeignKey(e => e.TrainingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.MicrocycleId, e.TrainingId }).IsUnique();
    }
}
