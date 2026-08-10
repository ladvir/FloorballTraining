using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.Property(p => p.UserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Endpoint).IsRequired().HasMaxLength(1000);
        builder.Property(p => p.P256dh).IsRequired();
        builder.Property(p => p.Auth).IsRequired();

        // Re-subscribing the same browser (same endpoint) updates the existing row.
        builder.HasIndex(p => p.Endpoint).IsUnique();
        builder.HasIndex(p => p.UserId);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
