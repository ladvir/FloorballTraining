﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrainingGenerator.DbContexts;

#nullable disable

namespace TrainingGenerator.Migrations
{
    [DbContext(typeof(TrainingDbContext))]
    [Migration("20220902085722_nullablestring1")]
    partial class nullablestring1
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "6.0.7");

            modelBuilder.Entity("TrainingGenerator.Models.Activity", b =>
                {
                    b.Property<int>("ActivityId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int?>("DurationMax")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsBallLeading")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsConeNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsDynamic")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlexibility")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlorbal")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlorballBallsNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlorballGateNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFootballBallNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsForDefender")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsForForward")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsForGoalman")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGame")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation1x1")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation2x1")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation2x2")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation2x3")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation3x3")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation4x4")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation5x5")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsHurdleNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsJumpingLadderNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsJumpingRopeNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsPass")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsPersistence")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsRelay")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsReleasing")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsResulutionDressNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsShooting")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsSpeed")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsStrength")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTeamWork")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTest")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsThinking")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingPartDril")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingPartStretching")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingPartWarmUp")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingWarmUpExcercise")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int?>("PersonsMax")
                        .HasColumnType("INTEGER");

                    b.Property<int?>("PersonsMin")
                        .HasColumnType("INTEGER");

                    b.Property<long>("RatingCount")
                        .HasColumnType("INTEGER");

                    b.Property<long>("RatingSum")
                        .HasColumnType("INTEGER");

                    b.HasKey("ActivityId");

                    b.ToTable("Activity");
                });

            modelBuilder.Entity("TrainingGenerator.Models.Training", b =>
                {
                    b.Property<int>("TrainingId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<int>("ActivityPauseTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("BeginTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("BlockPauseTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("DrilTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("Duration")
                        .HasColumnType("INTEGER");

                    b.Property<int>("EndTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("FlorbalPercent")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsBallLeading")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsConeNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsDynamic")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlexibility")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlorbal")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlorballBallsNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFlorballGateNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsFootballBallNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsForDefender")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsForForward")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsForGoalman")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGame")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation1x1")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation2x1")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation2x2")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation2x3")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation3x3")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation4x4")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsGameSituation5x5")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsHurdleNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsJumpingLadderNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsJumpingRopeNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsPass")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsPersistence")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsRelay")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsReleasing")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsResulutionDressNeeded")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsShooting")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsSpeed")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsStrength")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTeamWork")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTest")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsThinking")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingPartDril")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingPartStretching")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingPartWarmUp")
                        .HasColumnType("INTEGER");

                    b.Property<bool>("IsTrainingWarmUpExcercise")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("Note")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("PersonsMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("PersonsMin")
                        .HasColumnType("INTEGER");

                    b.Property<int>("StretchingTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("WarmUpExcerciseTimeMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("WarmUpTimeMax")
                        .HasColumnType("INTEGER");

                    b.HasKey("TrainingId");

                    b.ToTable("Training");
                });

            modelBuilder.Entity("TrainingGenerator.Models.TrainingActivity", b =>
                {
                    b.Property<int>("TrainingActivityId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<int?>("ActivityId")
                        .IsRequired()
                        .HasColumnType("INTEGER");

                    b.Property<int>("DurationMax")
                        .HasColumnType("INTEGER");

                    b.Property<int>("Order")
                        .HasColumnType("INTEGER");

                    b.Property<int>("TrainingId")
                        .HasColumnType("INTEGER");

                    b.HasKey("TrainingActivityId");

                    b.HasIndex("ActivityId");

                    b.HasIndex("TrainingId");

                    b.ToTable("TrainingActivity");
                });

            modelBuilder.Entity("TrainingGenerator.Models.TrainingActivity", b =>
                {
                    b.HasOne("TrainingGenerator.Models.Activity", "Activity")
                        .WithMany("TrainingActivities")
                        .HasForeignKey("ActivityId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("TrainingGenerator.Models.Training", "Training")
                        .WithMany("TrainingActivities")
                        .HasForeignKey("TrainingId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Activity");

                    b.Navigation("Training");
                });

            modelBuilder.Entity("TrainingGenerator.Models.Activity", b =>
                {
                    b.Navigation("TrainingActivities");
                });

            modelBuilder.Entity("TrainingGenerator.Models.Training", b =>
                {
                    b.Navigation("TrainingActivities");
                });
#pragma warning restore 612, 618
        }
    }
}
