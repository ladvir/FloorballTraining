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

        // Burned-in export (#141) is just another Video row under the same owner. SQL Server
        // rejects SetNull here (it would be a second cascade path from Videos alongside the
        // VideoId FK above) — VideoEFCoreRepository.DeleteAsync clears this reference itself
        // before deleting an exported video, so Restrict (NO ACTION) never actually blocks it.
        builder.HasOne(p => p.ExportedVideo)
            .WithMany()
            .HasForeignKey(p => p.ExportedVideoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
