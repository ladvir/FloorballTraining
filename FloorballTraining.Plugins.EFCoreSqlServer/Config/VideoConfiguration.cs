using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class VideoConfiguration : IEntityTypeConfiguration<Video>
{
    public void Configure(EntityTypeBuilder<Video> builder)
    {
        builder.Property(p => p.Url).HasMaxLength(2000);
        builder.Property(p => p.FilePath).HasMaxLength(1000);
        builder.Property(p => p.ThumbnailUrl).HasMaxLength(2000);
        builder.Property(p => p.Title).HasMaxLength(200);
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.UpdatedByUserId).HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();

        // Exactly one of these is set per row (enforced in the app layer, not the DB) — the video
        // belongs to whichever owner is non-null. Deleting the owner deletes its videos.
        builder.HasOne(v => v.Activity)
            .WithMany()
            .HasForeignKey(v => v.ActivityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.Training)
            .WithMany()
            .HasForeignKey(v => v.TrainingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.Appointment)
            .WithMany()
            .HasForeignKey(v => v.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
