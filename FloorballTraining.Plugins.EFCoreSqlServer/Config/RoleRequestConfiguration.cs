using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class RoleRequestConfiguration : IEntityTypeConfiguration<RoleRequest>
{
    public void Configure(EntityTypeBuilder<RoleRequest> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.RequestedRole).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Status).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.ResolvedByUserId).HasMaxLength(450);

        builder.HasOne(r => r.Member).WithMany().HasForeignKey(r => r.MemberId);
    }
}
