using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TestResultConfiguration : IEntityTypeConfiguration<TestResult>
{
    public void Configure(EntityTypeBuilder<TestResult> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.TestDefinitionId).IsRequired();
        builder.Property(p => p.MemberId).IsRequired();
        builder.Property(p => p.TestDate).IsRequired();
        builder.Property(p => p.Note).HasMaxLength(2000);
        builder.Property(p => p.RecordedByUserId).IsRequired().HasMaxLength(450);
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(r => r.TestDefinition)
            .WithMany(t => t.Results)
            .HasForeignKey(r => r.TestDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Member)
            .WithMany(m => m.TestResults)
            .HasForeignKey(r => r.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.GradeOption)
            .WithMany()
            .HasForeignKey(r => r.GradeOptionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.TestDefinitionId, r.MemberId });
        builder.HasIndex(r => r.MemberId);
    }
}
