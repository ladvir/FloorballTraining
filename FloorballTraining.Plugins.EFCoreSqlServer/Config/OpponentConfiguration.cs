using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class OpponentConfiguration : IEntityTypeConfiguration<Opponent>
{
    public void Configure(EntityTypeBuilder<Opponent> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);

        builder.HasOne(o => o.Club).WithMany().HasForeignKey(o => o.ClubId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => new { o.ClubId, o.Name }).IsUnique();
    }
}
