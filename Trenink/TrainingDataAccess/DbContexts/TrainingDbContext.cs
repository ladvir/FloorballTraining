using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.DbContexts
{
    public sealed class TrainingDbContext : DbContext
    {
        public TrainingDbContext(DbContextOptions options) : base(options)
        {
            ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
            ChangeTracker.LazyLoadingEnabled = false;
        }


        public DbSet<Activity> Activities { get; set; }

        public DbSet<Tag> Tags { get; set; }

        public DbSet<ActivityTag> ActivityTags { get; set; }

        public DbSet<TrainingPart> TrainingParts { get; set; }

        public DbSet<TrainingGroup> TrainingGroups { get; set; }

        public DbSet<Training> Trainings { get; set; }

        public DbSet<TrainingGroupActivity> TrainingGroupActivities { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Activity>()
                .HasMany<ActivityTag>(s => s.ActivityTags)
                .WithOne(c => c.Activity);

            modelBuilder.Entity<ActivityTag>()
                .HasKey(t => new { t.ActivityId, t.TagId })
                ;

            modelBuilder.Entity<ActivityTag>()
                .HasOne(am => am.Activity)
                .WithMany(a => a.ActivityTags)
                .HasForeignKey(am => am.ActivityId);

            modelBuilder.Entity<ActivityTag>()
                .HasOne(am => am.Tag)
                .WithMany(m => m.ActivityTags)
                .HasForeignKey(am => am.TagId);


            modelBuilder.Entity<TrainingPart>()
                .HasOne(tp => tp.Training)
                .WithMany(t => t.TrainingParts)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TrainingGroup>()
                            .HasOne(tp => tp.TrainingPart)
                            .WithMany(t => t.TrainingGroups)
                            .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<TrainingGroup>()
                .HasMany(a => a.TrainingGroupActivities)
                .WithOne(g => g.TrainingGroup);


            modelBuilder.Entity<TrainingGroupActivity>()
                .HasKey(t => new { t.TrainingGroupId, t.ActivityId });

            modelBuilder.Entity<TrainingGroupActivity>()
                .HasOne(am => am.TrainingGroup)
                .WithMany(a => a.TrainingGroupActivities)
                .HasForeignKey(am => am.TrainingGroupId);

            modelBuilder.Entity<TrainingGroupActivity>()
                .HasOne(am => am.Activity)
                .WithMany(m => m.TrainingGroupActivities)
                .HasForeignKey(am => am.ActivityId);



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

            modelBuilder.Seed();
        }
    }
}