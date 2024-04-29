using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();

        //builder.HasOne(t => t.AgeGroup).WithMany().HasForeignKey(a => a.AgeGroupId);
        //builder.HasOne(t => t.Club).WithMany().HasForeignKey(a => a.ClubId);

        //builder.HasMany(a => a.TeamTrainings).WithOne(a => a.Team).HasForeignKey(t => t.TeamId);
        //builder.HasMany(a => a.TeamMembers).WithOne(a => a.Team).HasForeignKey(t => t.TeamId);

    }
}
