using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class MemberSkillFocusConfiguration : IEntityTypeConfiguration<MemberSkillFocus>
{
    public void Configure(EntityTypeBuilder<MemberSkillFocus> builder)
    {
        builder.HasKey(f => new { f.MemberId, f.SkillId });

        builder.HasOne<Member>()
            .WithMany()
            .HasForeignKey(f => f.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Skill>()
            .WithMany()
            .HasForeignKey(f => f.SkillId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
