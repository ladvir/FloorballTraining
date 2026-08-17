using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class XpCoachAwardConfiguration : IEntityTypeConfiguration<XpCoachAward>
{
    public void Configure(EntityTypeBuilder<XpCoachAward> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.AppointmentId).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.Type).IsRequired();
        builder.Property(p => p.AwardedByUserId).IsRequired();
        builder.Property(p => p.AwardedAt).IsRequired();

        builder.HasOne(e => e.Appointment)
            .WithMany()
            .HasForeignKey(e => e.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Member)
            .WithMany()
            .HasForeignKey(e => e.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        // Anti-abuse: at most one of each bonus per (event, member, type).
        builder.HasIndex(e => new { e.AppointmentId, e.MemberId, e.Type }).IsUnique();

        // Anti-abuse: only ONE "Player of the training" per event (AwardType.PlayerOfTraining = 0).
        builder.HasIndex(e => e.AppointmentId)
            .IsUnique()
            .HasFilter("[Type] = 0");
    }
}
