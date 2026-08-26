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
        builder.Property(p => p.ActivitySignature).HasMaxLength(64);
        builder.HasIndex(p => p.ActivitySignature);
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.UpdatedByUserId).HasMaxLength(450);
        builder.HasIndex(p => p.CreatedByUserId);
        builder.HasOne(t => t.TrainingGoalSkill1).WithMany().HasForeignKey(x => x.TrainingGoalSkill1Id);
        builder.HasOne(t => t.TrainingGoalSkill2).WithMany().HasForeignKey(x => x.TrainingGoalSkill2Id);
        builder.HasOne(t => t.TrainingGoalSkill3).WithMany().HasForeignKey(x => x.TrainingGoalSkill3Id);
        builder.HasMany(t => t.TrainingTags).WithOne(tt => tt.Training).HasForeignKey(tt => tt.TrainingId);
        builder.HasMany(t => t.TrainingAgeGroups).WithOne(a => a.Training).HasForeignKey(a => a.TrainingId);
        builder.HasMany(t => t.TrainingParts).WithOne(a => a.Training).HasForeignKey(a => a.TrainingId);
    }
}