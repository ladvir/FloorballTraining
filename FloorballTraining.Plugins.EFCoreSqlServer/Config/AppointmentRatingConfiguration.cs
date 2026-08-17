using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AppointmentRatingConfiguration : IEntityTypeConfiguration<AppointmentRating>
{
    public void Configure(EntityTypeBuilder<AppointmentRating> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.AppointmentId).IsRequired();
        builder.Property(p => p.UserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Grade).IsRequired();
        builder.Property(p => p.Comment).HasMaxLength(2000);
        builder.Property(p => p.RaterType).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(r => r.Appointment)
            .WithMany(a => a.Ratings)
            .HasForeignKey(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.AppointmentId, r.UserId }).IsUnique();
    }
}
