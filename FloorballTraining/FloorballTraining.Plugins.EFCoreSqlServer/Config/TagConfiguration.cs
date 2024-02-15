using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config
{

    public class TagConfiguration : IEntityTypeConfiguration<Tag>
    {
        public void Configure(EntityTypeBuilder<Tag> builder)
        {
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.IsTrainingGoal).IsRequired().HasDefaultValue(false);

            builder.HasMany(t => t.ActivityTags).WithOne(at => at.Tag).HasForeignKey(a => a.TagId);
            builder.HasMany(t => t.Trainings1).WithOne(t => t.TrainingGoal1).HasForeignKey(a => a.TrainingGoal1Id);
            builder.HasMany(t => t.Trainings2).WithOne(t => t.TrainingGoal2).HasForeignKey(a => a.TrainingGoal2Id);
            builder.HasMany(t => t.Trainings3).WithOne(t => t.TrainingGoal3).HasForeignKey(a => a.TrainingGoal3Id);
        }
    }
}
