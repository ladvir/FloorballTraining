using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class PlayerSkillRatingConfiguration : IEntityTypeConfiguration<PlayerSkillRating>
{
    public void Configure(EntityTypeBuilder<PlayerSkillRating> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.SkillId).IsRequired();
        builder.Property(p => p.Grade).IsRequired();
        builder.Property(p => p.Recommendation).HasMaxLength(2000);
        builder.Property(p => p.RatedAt).IsRequired();
        builder.Property(p => p.RatedByAppUserId).IsRequired().HasMaxLength(450);

        builder.HasOne(r => r.Member)
            .WithMany(m => m.PlayerSkillRatings)
            .HasForeignKey(r => r.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Skill)
            .WithMany(s => s.Ratings)
            .HasForeignKey(r => r.SkillId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.MemberId, r.SkillId, r.RatedAt });
        builder.HasIndex(r => r.MemberId);
    }
}
