using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class AnnouncerLibraryItemConfiguration : IEntityTypeConfiguration<AnnouncerLibraryItem>
{
    public void Configure(EntityTypeBuilder<AnnouncerLibraryItem> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.UserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(120);
        builder.Property(p => p.Text).IsRequired().HasMaxLength(4000);
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasIndex(e => new { e.UserId, e.CreatedAt });
    }
}
