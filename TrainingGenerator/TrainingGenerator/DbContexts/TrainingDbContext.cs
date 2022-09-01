using EntityFramework.Exceptions.Sqlite;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System;
using System.Xml;
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.DeclaringType.GetType() == typeof(bool))
                    {
                        var converterType = typeof(BoolToZeroOneConverter<int>).MakeGenericType(property.ClrType);
                        var converter = (ValueConverter)Activator.CreateInstance(converterType, (object)null);
                        property.SetValueConverter(converter);
                    }
                }
            }
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Debug, Microsoft.EntityFrameworkCore.Diagnostics.DbContextLoggerOptions.SingleLine);
            optionsBuilder.UseExceptionProcessor();
        }
    }
}