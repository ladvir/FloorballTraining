using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class VideoAnnotationConfiguration : IEntityTypeConfiguration<VideoAnnotation>
{
    public void Configure(EntityTypeBuilder<VideoAnnotation> builder)
    {
        builder.Property(p => p.DataJson).IsRequired();
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.UpdatedByUserId).HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();

        // One annotation per video.
        builder.HasIndex(p => p.VideoId).IsUnique();

        builder.HasOne(p => p.Video)
            .WithOne()
            .HasForeignKey<VideoAnnotation>(p => p.VideoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
