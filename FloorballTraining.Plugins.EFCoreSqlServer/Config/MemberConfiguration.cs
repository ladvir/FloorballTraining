using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.FirstName).IsRequired();
        builder.Property(p => p.LastName).IsRequired();
        builder.Property(p => p.BirthYear).IsRequired();
        builder.Property(p => p.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(p => p.Email).IsRequired();
        builder.Property(p => p.HasClubRoleClubAdmin).IsRequired();
        builder.Property(p => p.HasClubRoleMainCoach).IsRequired();
        builder.Property(p => p.HasClubRoleCoach).IsRequired();

        builder.Property(p => p.AppUserId).HasMaxLength(450);
        builder.HasIndex(p => p.AppUserId);
    }
}
