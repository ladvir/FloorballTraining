using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberRewardClaimConfiguration : IEntityTypeConfiguration<MemberRewardClaim>
{
    public void Configure(EntityTypeBuilder<MemberRewardClaim> builder)
    {
        builder.Property(p => p.EarnedAt).IsRequired();
        builder.Property(p => p.Status).IsRequired();

        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.ClubReward)
            .WithMany()
            .HasForeignKey(e => e.ClubRewardId)
            .OnDelete(DeleteBehavior.Cascade);

        // Idempotent: at most one claim per (member, reward). A recompute inserts nothing new.
        builder.HasIndex(e => new { e.MemberId, e.ClubRewardId }).IsUnique();
    }
}
