using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TrainingTemplateConfiguration : IEntityTypeConfiguration<TrainingTemplate>
{
    public void Configure(EntityTypeBuilder<TrainingTemplate> builder)
    {
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.HasMany(t => t.Parts).WithOne(p => p.TrainingTemplate)
            .HasForeignKey(p => p.TrainingTemplateId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class TrainingTemplatePartConfiguration : IEntityTypeConfiguration<TrainingTemplatePart>
{
    public void Configure(EntityTypeBuilder<TrainingTemplatePart> builder)
    {
        builder.Property(p => p.Name).HasMaxLength(200);
        builder.HasMany(p => p.Activities).WithOne(a => a.TrainingTemplatePart)
            .HasForeignKey(a => a.TrainingTemplatePartId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class TrainingTemplatePartActivityConfiguration : IEntityTypeConfiguration<TrainingTemplatePartActivity>
{
    public void Configure(EntityTypeBuilder<TrainingTemplatePartActivity> builder)
    {
        // Smazání aktivity odstraní jen její zařazení do šablon, šablona zůstává.
        builder.HasOne(a => a.Activity).WithMany()
            .HasForeignKey(a => a.ActivityId).OnDelete(DeleteBehavior.Cascade);
    }
}
