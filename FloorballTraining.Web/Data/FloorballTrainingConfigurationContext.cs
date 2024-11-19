using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using FloorballTraining.Web.Models.FloorballTrainingConfiguration;

namespace FloorballTraining.Web.Data
{
    public partial class FloorballTrainingConfigurationContext : DbContext
    {
        public FloorballTrainingConfigurationContext()
        {
        }

        public FloorballTrainingConfigurationContext(DbContextOptions<FloorballTrainingConfigurationContext> options) : base(options)
        {
        }

        partial void OnModelBuilding(ModelBuilder builder);

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityAgeGroups)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup>()
              .HasOne(i => i.AgeGroup)
              .WithMany(i => i.ActivityAgeGroups)
              .HasForeignKey(i => i.AgeGroupId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityEquipments)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment>()
              .HasOne(i => i.Equipment)
              .WithMany(i => i.ActivityEquipments)
              .HasForeignKey(i => i.EquipmentId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityMedia)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityTags)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag>()
              .HasOne(i => i.Tag)
              .WithMany(i => i.ActivityTags)
              .HasForeignKey(i => i.TagId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>()
              .HasOne(i => i.Place)
              .WithMany(i => i.Appointments)
              .HasForeignKey(i => i.LocationId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>()
              .HasOne(i => i.Appointment1)
              .WithMany(i => i.Appointments1)
              .HasForeignKey(i => i.ParentAppointmentId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>()
              .HasOne(i => i.Team)
              .WithMany(i => i.Appointments)
              .HasForeignKey(i => i.TeamId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>()
              .HasOne(i => i.Training)
              .WithMany(i => i.Appointments)
              .HasForeignKey(i => i.TrainingId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member>()
              .HasOne(i => i.Club)
              .WithMany(i => i.Members)
              .HasForeignKey(i => i.ClubId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern>()
              .HasOne(i => i.Appointment)
              .WithMany(i => i.RepeatingPatterns)
              .HasForeignKey(i => i.InitialAppointmentId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag>()
              .HasOne(i => i.Tag1)
              .WithMany(i => i.Tags1)
              .HasForeignKey(i => i.ParentTagId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember>()
              .HasOne(i => i.Member)
              .WithMany(i => i.TeamMembers)
              .HasForeignKey(i => i.MemberId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember>()
              .HasOne(i => i.Team)
              .WithMany(i => i.TeamMembers)
              .HasForeignKey(i => i.TeamId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team>()
              .HasOne(i => i.AgeGroup)
              .WithMany(i => i.Teams)
              .HasForeignKey(i => i.AgeGroupId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team>()
              .HasOne(i => i.Club)
              .WithMany(i => i.Teams)
              .HasForeignKey(i => i.ClubId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup>()
              .HasOne(i => i.AgeGroup)
              .WithMany(i => i.TrainingAgeGroups)
              .HasForeignKey(i => i.AgeGroupId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup>()
              .HasOne(i => i.Training)
              .WithMany(i => i.TrainingAgeGroups)
              .HasForeignKey(i => i.TrainingId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.TrainingGroups)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup>()
              .HasOne(i => i.TrainingPart)
              .WithMany(i => i.TrainingGroups)
              .HasForeignKey(i => i.TrainingPartId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart>()
              .HasOne(i => i.Training)
              .WithMany(i => i.TrainingParts)
              .HasForeignKey(i => i.TrainingId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>()
              .HasOne(i => i.Place)
              .WithMany(i => i.Trainings)
              .HasForeignKey(i => i.PlaceId)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>()
              .HasOne(i => i.Tag)
              .WithMany(i => i.Trainings)
              .HasForeignKey(i => i.TrainingGoal1Id)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>()
              .HasOne(i => i.Tag1)
              .WithMany(i => i.Trainings1)
              .HasForeignKey(i => i.TrainingGoal2Id)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>()
              .HasOne(i => i.Tag2)
              .WithMany(i => i.Trainings2)
              .HasForeignKey(i => i.TrainingGoal3Id)
              .HasPrincipalKey(i => i.Id)
              .OnDelete(DeleteBehavior.ClientNoAction);

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member>()
              .Property(p => p.HasClubRoleMainCoach)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member>()
              .Property(p => p.HasClubRoleManager)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member>()
              .Property(p => p.HasClubRoleSecretary)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag>()
              .Property(p => p.IsTrainingGoal)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember>()
              .Property(p => p.IsCoach)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember>()
              .Property(p => p.IsPlayer)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>()
              .Property(p => p.GoaliesMax)
              .HasDefaultValueSql(@"((0))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training>()
              .Property(p => p.GoaliesMin)
              .HasDefaultValueSql(@"((0))");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>()
              .Property(p => p.Start)
              .HasColumnType("datetime2");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment>()
              .Property(p => p.End)
              .HasColumnType("datetime2");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern>()
              .Property(p => p.StartDate)
              .HasColumnType("datetime2");

            builder.Entity<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern>()
              .Property(p => p.EndDate)
              .HasColumnType("datetime2");
            this.OnModelBuilding(builder);
        }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Activity> Activities { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityAgeGroup> ActivityAgeGroups { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityEquipment> ActivityEquipments { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityMedium> ActivityMedia { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.ActivityTag> ActivityTags { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.AgeGroup> AgeGroups { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Appointment> Appointments { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Club> Clubs { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Equipment> Equipments { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Member> Members { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Place> Places { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.RepeatingPattern> RepeatingPatterns { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Tag> Tags { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TeamMember> TeamMembers { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Team> Teams { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingAgeGroup> TrainingAgeGroups { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingGroup> TrainingGroups { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.TrainingPart> TrainingParts { get; set; }

        public DbSet<FloorballTraining.Web.Models.FloorballTrainingConfiguration.Training> Trainings { get; set; }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Conventions.Add(_ => new BlankTriggerAddingConvention());
            configurationBuilder.Conventions.Remove(typeof(Microsoft.EntityFrameworkCore.Metadata.Conventions.CascadeDeleteConvention));
            configurationBuilder.Conventions.Remove(typeof(Microsoft.EntityFrameworkCore.Metadata.Conventions.SqlServerOnDeleteConvention));
        }
    }
}