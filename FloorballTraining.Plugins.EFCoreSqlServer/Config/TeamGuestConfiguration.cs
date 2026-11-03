using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TeamGuestConfiguration : IEntityTypeConfiguration<TeamGuest>
{
    public void Configure(EntityTypeBuilder<TeamGuest> builder)
    {
        builder.Property(p => p.AppUserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.HasOne(g => g.Team).WithMany().HasForeignKey(g => g.TeamId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(g => new { g.TeamId, g.AppUserId }).IsUnique();
        builder.HasIndex(g => g.AppUserId);
    }
}
