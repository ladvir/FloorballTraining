using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class XpEventConfiguration : IEntityTypeConfiguration<XpEvent>
{
    public void Configure(EntityTypeBuilder<XpEvent> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Type).IsRequired();
        builder.Property(p => p.Points).IsRequired();
        builder.Property(p => p.SourceKind).IsRequired();
        builder.Property(p => p.OccurredAt).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Season)
            .WithMany()
            .HasForeignKey(e => e.SeasonId)
            .OnDelete(DeleteBehavior.NoAction);

        // Idempotence: one source record yields a given XP type exactly once.
        builder.HasIndex(e => new { e.Type, e.SourceKind, e.SourceId }).IsUnique();
        builder.HasIndex(e => new { e.MemberId, e.SeasonId });
    }
}
