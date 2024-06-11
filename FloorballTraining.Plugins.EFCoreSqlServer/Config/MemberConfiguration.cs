using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();
        builder.Property(p => p.Email).IsRequired();
        builder.Property(p => p.HasClubRoleManager).IsRequired();
        builder.Property(p => p.HasClubRoleSecretary).IsRequired();
        builder.Property(p => p.HasClubRoleMainCoach).IsRequired();

        //builder.HasOne(t => t.Club).WithMany().HasForeignKey(a => a.ClubId);
    }
}
