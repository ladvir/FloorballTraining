using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class IndividualWorkoutConfiguration : IEntityTypeConfiguration<IndividualWorkout>
{
    public void Configure(EntityTypeBuilder<IndividualWorkout> builder)
    {
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.PlayerNote).HasMaxLength(1000);
        builder.Property(p => p.AssignedByUserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Status).IsRequired();

        builder.HasOne(w => w.Member)
            .WithMany()
            .HasForeignKey(w => w.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => w.MemberId);
        builder.HasIndex(w => new { w.MemberId, w.Status });
    }
}
