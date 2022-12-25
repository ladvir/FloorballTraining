﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrainingDataAccess.DbContexts;

#nullable disable

namespace TrainingDataAccess.Migrations
{
    [DbContext(typeof(TrainingDbContext))]
    [Migration("20221223123710_Initial")]
    partial class Initial
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "7.0.1");

            modelBuilder.Entity("TrainingDataAccess.Models.Activity", b =>
                {
                    b.Property<int>("ActivityId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int?>("PersonsMax")
                        .HasColumnType("INTEGER");

                    b.Property<int?>("PersonsMin")
                        .HasColumnType("INTEGER");

                    b.HasKey("ActivityId");

                    b.ToTable("Activity");
                });
#pragma warning restore 612, 618
        }
    }
}
