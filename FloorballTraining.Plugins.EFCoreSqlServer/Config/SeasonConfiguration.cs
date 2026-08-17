using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class SeasonConfiguration : IEntityTypeConfiguration<Season>
{
    public void Configure(EntityTypeBuilder<Season> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();
        builder.HasMany(s => s.Teams).WithOne(t => t.Season).HasForeignKey(t => t.SeasonId);
        builder.HasOne(s => s.Club).WithMany().HasForeignKey(s => s.ClubId);
    }
}
