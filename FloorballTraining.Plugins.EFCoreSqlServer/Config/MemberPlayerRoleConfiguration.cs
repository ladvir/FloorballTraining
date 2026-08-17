using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberPlayerRoleConfiguration : IEntityTypeConfiguration<MemberPlayerRole>
{
    public void Configure(EntityTypeBuilder<MemberPlayerRole> builder)
    {
        builder.HasKey(r => r.MemberId);
        builder.Property(r => r.MemberId).ValueGeneratedNever();
        builder.Property(r => r.Position).IsRequired();

        builder.HasOne<Member>()
            .WithOne()
            .HasForeignKey<MemberPlayerRole>(r => r.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
