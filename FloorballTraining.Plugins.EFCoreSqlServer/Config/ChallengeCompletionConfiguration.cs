using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class ChallengeCompletionConfiguration : IEntityTypeConfiguration<ChallengeCompletion>
{
    public void Configure(EntityTypeBuilder<ChallengeCompletion> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Code).IsRequired().HasMaxLength(50);
        builder.Property(p => p.PeriodKey).IsRequired().HasMaxLength(20);
        builder.Property(p => p.CompletedAt).IsRequired();

        builder.HasOne(c => c.Member)
            .WithMany()
            .HasForeignKey(c => c.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Idempotence: a challenge is completed once per (member, code, window).
        builder.HasIndex(c => new { c.MemberId, c.Code, c.PeriodKey }).IsUnique();
    }
}
