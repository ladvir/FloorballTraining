using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using FloorballTraining.Identity.Models.FloorballTrainingIdentity;

namespace FloorballTraining.Identity.Data
{
    public partial class FloorballTrainingIdentityContext : DbContext
    {
        public FloorballTrainingIdentityContext()
        {
        }

        public FloorballTrainingIdentityContext(DbContextOptions<FloorballTrainingIdentityContext> options) : base(options)
        {
        }

        partial void OnModelBuilding(ModelBuilder builder);

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityAgeGroups)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup>()
              .HasOne(i => i.AgeGroup)
              .WithMany(i => i.ActivityAgeGroups)
              .HasForeignKey(i => i.AgeGroupId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityEquipments)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment>()
              .HasOne(i => i.Equipment)
              .WithMany(i => i.ActivityEquipments)
              .HasForeignKey(i => i.EquipmentId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityMedia)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.ActivityTags)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag>()
              .HasOne(i => i.Tag)
              .WithMany(i => i.ActivityTags)
              .HasForeignKey(i => i.TagId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>()
              .HasOne(i => i.Place)
              .WithMany(i => i.Appointments)
              .HasForeignKey(i => i.LocationId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>()
              .HasOne(i => i.Appointment1)
              .WithMany(i => i.Appointments1)
              .HasForeignKey(i => i.ParentAppointmentId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>()
              .HasOne(i => i.Team)
              .WithMany(i => i.Appointments)
              .HasForeignKey(i => i.TeamId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>()
              .HasOne(i => i.Training)
              .WithMany(i => i.Appointments)
              .HasForeignKey(i => i.TrainingId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member>()
              .HasOne(i => i.Club)
              .WithMany(i => i.Members)
              .HasForeignKey(i => i.ClubId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern>()
              .HasOne(i => i.Appointment)
              .WithMany(i => i.RepeatingPatterns)
              .HasForeignKey(i => i.InitialAppointmentId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag>()
              .HasOne(i => i.Tag1)
              .WithMany(i => i.Tags1)
              .HasForeignKey(i => i.ParentTagId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember>()
              .HasOne(i => i.Member)
              .WithMany(i => i.TeamMembers)
              .HasForeignKey(i => i.MemberId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember>()
              .HasOne(i => i.Team)
              .WithMany(i => i.TeamMembers)
              .HasForeignKey(i => i.TeamId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team>()
              .HasOne(i => i.AgeGroup)
              .WithMany(i => i.Teams)
              .HasForeignKey(i => i.AgeGroupId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team>()
              .HasOne(i => i.Club)
              .WithMany(i => i.Teams)
              .HasForeignKey(i => i.ClubId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup>()
              .HasOne(i => i.AgeGroup)
              .WithMany(i => i.TrainingAgeGroups)
              .HasForeignKey(i => i.AgeGroupId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup>()
              .HasOne(i => i.Training)
              .WithMany(i => i.TrainingAgeGroups)
              .HasForeignKey(i => i.TrainingId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup>()
              .HasOne(i => i.Activity)
              .WithMany(i => i.TrainingGroups)
              .HasForeignKey(i => i.ActivityId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup>()
              .HasOne(i => i.TrainingPart)
              .WithMany(i => i.TrainingGroups)
              .HasForeignKey(i => i.TrainingPartId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart>()
              .HasOne(i => i.Training)
              .WithMany(i => i.TrainingParts)
              .HasForeignKey(i => i.TrainingId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>()
              .HasOne(i => i.Place)
              .WithMany(i => i.Trainings)
              .HasForeignKey(i => i.PlaceId)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>()
              .HasOne(i => i.Tag)
              .WithMany(i => i.Trainings)
              .HasForeignKey(i => i.TrainingGoal1Id)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>()
              .HasOne(i => i.Tag1)
              .WithMany(i => i.Trainings1)
              .HasForeignKey(i => i.TrainingGoal2Id)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>()
              .HasOne(i => i.Tag2)
              .WithMany(i => i.Trainings2)
              .HasForeignKey(i => i.TrainingGoal3Id)
              .HasPrincipalKey(i => i.Id);

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member>()
              .Property(p => p.HasClubRoleMainCoach)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member>()
              .Property(p => p.HasClubRoleManager)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member>()
              .Property(p => p.HasClubRoleSecretary)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag>()
              .Property(p => p.IsTrainingGoal)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember>()
              .Property(p => p.IsCoach)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember>()
              .Property(p => p.IsPlayer)
              .HasDefaultValueSql(@"(CONVERT([bit],(0)))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>()
              .Property(p => p.GoaliesMax)
              .HasDefaultValueSql(@"((0))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training>()
              .Property(p => p.GoaliesMin)
              .HasDefaultValueSql(@"((0))");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>()
              .Property(p => p.Start)
              .HasColumnType("datetime2");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment>()
              .Property(p => p.End)
              .HasColumnType("datetime2");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern>()
              .Property(p => p.StartDate)
              .HasColumnType("datetime2");

            builder.Entity<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern>()
              .Property(p => p.EndDate)
              .HasColumnType("datetime2");
            this.OnModelBuilding(builder);
        }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Activity> Activities { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityAgeGroup> ActivityAgeGroups { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityEquipment> ActivityEquipments { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityMedium> ActivityMedia { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.ActivityTag> ActivityTags { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.AgeGroup> AgeGroups { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Appointment> Appointments { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Club> Clubs { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Equipment> Equipments { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Member> Members { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Place> Places { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.RepeatingPattern> RepeatingPatterns { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Tag> Tags { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TeamMember> TeamMembers { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Team> Teams { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingAgeGroup> TrainingAgeGroups { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingGroup> TrainingGroups { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.TrainingPart> TrainingParts { get; set; }

        public DbSet<FloorballTraining.Identity.Models.FloorballTrainingIdentity.Training> Trainings { get; set; }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Conventions.Add(_ => new BlankTriggerAddingConvention());
        }
    }
}