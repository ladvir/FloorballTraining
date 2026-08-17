using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class UserAiCredentialConfiguration : IEntityTypeConfiguration<UserAiCredential>
{
    public void Configure(EntityTypeBuilder<UserAiCredential> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.Property(e => e.EncryptedApiKey).IsRequired();
        builder.Property(e => e.KeyLast4).IsRequired().HasMaxLength(4);
        builder.Property(e => e.Model).HasMaxLength(100);
        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
        // At most one active credential per user (filtered index works on SQL Server and SQLite).
        builder.HasIndex(e => e.UserId).IsUnique().HasFilter("[IsActive] = 1");
    }
}
