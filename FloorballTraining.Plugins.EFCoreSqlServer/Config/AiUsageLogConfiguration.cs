using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AiUsageLogConfiguration : IEntityTypeConfiguration<AiUsageLog>
{
    public void Configure(EntityTypeBuilder<AiUsageLog> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
        builder.Property(e => e.Model).IsRequired().HasMaxLength(100);
        builder.Property(e => e.ErrorType).HasMaxLength(100);
        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        // Usage history must survive credential deletion (metering/billing record).
        builder.HasOne<UserAiCredential>()
            .WithMany()
            .HasForeignKey(e => e.CredentialId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => new { e.ClubId, e.CreatedAt });
        builder.HasIndex(e => new { e.UserId, e.CreatedAt });
    }
}
