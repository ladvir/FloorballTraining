using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberGuardianConfiguration : IEntityTypeConfiguration<MemberGuardian>
{
    public void Configure(EntityTypeBuilder<MemberGuardian> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.GuardianAppUserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.CreatedByUserId).HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(g => g.Member).WithMany().HasForeignKey(g => g.MemberId);

        // One guardian can be linked to a child only once.
        builder.HasIndex(g => new { g.MemberId, g.GuardianAppUserId }).IsUnique();
    }
}
