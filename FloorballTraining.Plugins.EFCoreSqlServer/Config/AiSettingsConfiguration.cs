using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AiSettingsConfiguration : IEntityTypeConfiguration<AiSettings>
{
    public void Configure(EntityTypeBuilder<AiSettings> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.DefaultModel).HasMaxLength(100);
        builder.Property(e => e.CreatedByUserId).HasMaxLength(450);
        builder.Property(e => e.UpdatedByUserId).HasMaxLength(450);

        builder.HasOne(e => e.Club)
            .WithMany()
            .HasForeignKey(e => e.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

        // Deleting a credential must not delete settings — the default just becomes empty.
        builder.HasOne(e => e.DefaultCredential)
            .WithMany()
            .HasForeignKey(e => e.DefaultCredentialId)
            .OnDelete(DeleteBehavior.SetNull);

        // One row per club; the ClubId-null global row is unique by convention
        // (unique index ignores nulls on SQL Server only for filtered indexes,
        // so guard the single global row in code).
        builder.HasIndex(e => e.ClubId).IsUnique();
    }
}
