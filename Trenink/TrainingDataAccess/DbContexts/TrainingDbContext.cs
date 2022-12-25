using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.DbContexts
{
    public class TrainingDbContext : DbContext
    {
        public TrainingDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Activity> Activities { get; set; } = null!;
        //public DbSet<Training> Trainings { get; set; }

        //public DbSet<TrainingActivity> TrainingActivities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.DeclaringType.GetType() == typeof(bool))
                    {
                        var converterType = typeof(BoolToZeroOneConverter<int>).MakeGenericType(property.ClrType);
                        var converter = (ValueConverter)Activator.CreateInstance(converterType, null)!;
                        property.SetValueConverter(converter);
                    }
                }
            }

            // modelBuilder.Entity<Training>(entity =>    {entity.Property(e => e.Note).IsRequired(false);   });



        }

        /*protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    => optionsBuilder
        .UseLazyLoadingProxies();*/
    }
}