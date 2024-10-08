﻿using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Config;

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.Property(p => p.Id).IsRequired();
        builder.Property(p => p.Name).IsRequired();
        builder.HasMany(a => a.TeamMembers).WithOne(a => a.Team).HasForeignKey(t => t.TeamId);

        //builder.HasMany(a => a.Appointments).WithOne(a => a.Team).HasForeignKey(t => t.TeamId);
    }
}