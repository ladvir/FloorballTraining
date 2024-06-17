using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class ClubConfiguration : IEntityTypeConfiguration<Club>
{
    public void Configure(EntityTypeBuilder<Club> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();

        builder.HasMany(a => a.Teams).WithOne(a => a.Club).HasForeignKey(t => t.ClubId);
        builder.HasMany(a => a.Members).WithOne(a => a.Club).HasForeignKey(t => t.ClubId);
    }
}