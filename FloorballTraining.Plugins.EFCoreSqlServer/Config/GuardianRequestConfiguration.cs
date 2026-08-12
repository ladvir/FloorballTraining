using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class GuardianRequestConfiguration : IEntityTypeConfiguration<GuardianRequest>
{
    public void Configure(EntityTypeBuilder<GuardianRequest> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.GuardianAppUserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.Status).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.ResolvedByUserId).HasMaxLength(450);

        builder.HasOne(r => r.Member).WithMany().HasForeignKey(r => r.MemberId);
    }
}
