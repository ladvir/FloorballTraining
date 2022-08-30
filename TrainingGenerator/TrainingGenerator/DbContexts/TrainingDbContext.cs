using EntityFramework.Exceptions.Sqlite;

using Microsoft.EntityFrameworkCore;
using System;
using TrainingGenerator.Models;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace TrainingGenerator.DbContexts
{
    public class TrainingDbContext : DbContext
    {
        public TrainingDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Activity> Activities { get; set; }
        public DbSet<Training> Trainings { get; set; }

        public DbSet<TrainingActivity> TrainingActivities { get; set; }

        /*protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Activity>().HasMany(c => c.TrainingActivities).WithOne(e => e.Activity);
        }*/

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Debug, Microsoft.EntityFrameworkCore.Diagnostics.DbContextLoggerOptions.SingleLine);
            optionsBuilder.UseExceptionProcessor();
        }
    }
}