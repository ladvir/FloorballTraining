using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AiCredentialConsentConfiguration : IEntityTypeConfiguration<AiCredentialConsent>
{
    public void Configure(EntityTypeBuilder<AiCredentialConsent> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.Credential)
            .WithMany(c => c.Consents)
            .HasForeignKey(e => e.CredentialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.GrantedToClub)
            .WithMany()
            .HasForeignKey(e => e.GrantedToClubId)
            .OnDelete(DeleteBehavior.Cascade);

        // One consent per (credential, club); GrantedToClubId null = the single Global consent.
        builder.HasIndex(e => new { e.CredentialId, e.GrantedToClubId }).IsUnique();
        // The SQL Server unique index above ignores NULL club ids, so enforce a single
        // Global consent per credential with a dedicated filtered index.
        builder.HasIndex(e => e.CredentialId)
            .IsUnique()
            .HasFilter("[GrantedToClubId] IS NULL")
            .HasDatabaseName("IX_AiCredentialConsents_CredentialId_GlobalScope");
    }
}
