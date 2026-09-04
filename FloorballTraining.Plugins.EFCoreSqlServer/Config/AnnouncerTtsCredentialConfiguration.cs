using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AnnouncerTtsCredentialConfiguration : IEntityTypeConfiguration<AnnouncerTtsCredential>
{
    public void Configure(EntityTypeBuilder<AnnouncerTtsCredential> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.UserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Region).IsRequired().HasMaxLength(40);
        builder.Property(p => p.EncryptedApiKey).IsRequired();
        builder.Property(p => p.KeyLast4).IsRequired().HasMaxLength(4);
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasIndex(e => e.UserId).IsUnique(); // one key per user
    }
}
