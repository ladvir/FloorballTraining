using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TrainingConfiguration : IEntityTypeConfiguration<Training>
{
    public void Configure(EntityTypeBuilder<Training> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();
        builder.HasOne(t => t.TrainingGoal1).WithMany(x => x.Trainings1).HasForeignKey(x => x.TrainingGoal1Id);
        builder.HasOne(t => t.TrainingGoal2).WithMany(x => x.Trainings2).HasForeignKey(x => x.TrainingGoal2Id);
        builder.HasOne(t => t.TrainingGoal3).WithMany(x => x.Trainings3).HasForeignKey(x => x.TrainingGoal3Id);
        builder.HasMany(t => t.TrainingAgeGroups).WithOne(a => a.Training).HasForeignKey(a => a.TrainingId);
        builder.HasMany(t => t.TrainingParts).WithOne(a => a.Training).HasForeignKey(a => a.TrainingId);
    }
}