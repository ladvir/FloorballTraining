using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MicrocycleConfiguration : IEntityTypeConfiguration<Microcycle>
{
    public void Configure(EntityTypeBuilder<Microcycle> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Goal).HasMaxLength(2000);
        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.Mesocycle)
            .WithMany(m => m.Microcycles)
            .HasForeignKey(e => e.MesocycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.GoalSkill1).WithMany().HasForeignKey(e => e.GoalSkill1Id);
        builder.HasOne(e => e.GoalSkill2).WithMany().HasForeignKey(e => e.GoalSkill2Id);
        builder.HasOne(e => e.GoalSkill3).WithMany().HasForeignKey(e => e.GoalSkill3Id);

        builder.HasIndex(e => new { e.MesocycleId, e.StartDate });
    }
}
