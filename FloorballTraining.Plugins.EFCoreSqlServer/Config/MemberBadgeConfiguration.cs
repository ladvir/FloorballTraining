using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberBadgeConfiguration : IEntityTypeConfiguration<MemberBadge>
{
    public void Configure(EntityTypeBuilder<MemberBadge> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Code).IsRequired();
        builder.Property(p => p.EarnedAt).IsRequired();

        builder.HasOne(b => b.Member)
            .WithMany()
            .HasForeignKey(b => b.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.Season)
            .WithMany()
            .HasForeignKey(b => b.SeasonId)
            .OnDelete(DeleteBehavior.NoAction);

        // Idempotence: a badge is earned once per (member, code, season).
        builder.HasIndex(b => new { b.MemberId, b.Code, b.SeasonId }).IsUnique();
    }
}
