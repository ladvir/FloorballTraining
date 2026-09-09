using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class ExpoPushTokenConfiguration : IEntityTypeConfiguration<ExpoPushToken>
{
    public void Configure(EntityTypeBuilder<ExpoPushToken> builder)
    {
        builder.Property(p => p.UserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Token).IsRequired().HasMaxLength(500);

        // Re-registering the same device (same token) just re-points it at the current user.
        builder.HasIndex(p => p.Token).IsUnique();
        builder.HasIndex(p => p.UserId);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
