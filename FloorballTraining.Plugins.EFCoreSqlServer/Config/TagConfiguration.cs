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
            builder.HasMany(t => t.TrainingTags).WithOne(tt => tt.Tag).HasForeignKey(tt => tt.TagId);
        }
    }
}
