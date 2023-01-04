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

            //Seed(modelBuilder);

        }

        private void Seed(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Activity>().HasData(
                new Activity { ActivityId = 1, Name = "Akt 1", Description = "Descr 1" },
                new Activity { ActivityId = 2, Name = "Akt 2", Description = "Descr 2" },
                new Activity { ActivityId = 3, Name = "Akt 3", Description = "Descr 3" },
                new Activity { ActivityId = 4, Name = "Akt 4", Description = "Descr 4" },
                new Activity { ActivityId = 5, Name = "Akt 5", Description = "Descr 5" }
            );


            modelBuilder.Entity<Tag>().HasData(
                new Tag { TagId = 1, Name = "Tag 1" },
                new Tag { TagId = 2, Name = "Tag 2" },
                new Tag { TagId = 3, Name = "Tag 3" },
                new Tag { TagId = 4, Name = "Tag 4" },
                new Tag { TagId = 5, Name = "Tag 5" }
            );

            modelBuilder
                .Entity<Activity>()
                .HasMany(p => p.Tags)
                .WithMany(p => p.Activities);



            modelBuilder.SharedTypeEntity<Dictionary<string, object>>("ActivitiesTags")
            .HasData(
            new { ActivityId = 1, TagId = 1 },
            new { ActivityId = 1, TagId = 2 },
            new { ActivityId = 2, TagId = 3 },
            new { ActivityId = 3, TagId = 4 },
            new { ActivityId = 5, TagId = 4 },
            new { ActivityId = 5, TagId = 5 }
            );
        }
    }
}