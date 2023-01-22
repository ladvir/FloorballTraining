using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.DbContexts
{
    public class TrainingDbContext : DbContext
    {


        public TrainingDbContext(DbContextOptions options) : base(options) { }


        public DbSet<Activity> Activities { get; set; }

        public DbSet<Tag> Tags { get; set; }


        //public DbSet<Training> Trainings { get; set; }

        //public DbSet<TrainingActivity> TrainingActivities { get; set; }




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties().
                             Where(p => (p.DeclaringEntityType.GetType()) == typeof(bool)))
                {
                    var converterType = typeof(BoolToZeroOneConverter<int>).MakeGenericType(property.ClrType);
                    var converter = (ValueConverter)Activator.CreateInstance(converterType, null)!;
                    property.SetValueConverter(converter);

                }
            }

            /*modelBuilder
                .Entity<Activity>()
                .HasMany(p => p.Tags)
                .WithMany(p => p.Activities);*/


            modelBuilder.Seed();
        }
    }
}