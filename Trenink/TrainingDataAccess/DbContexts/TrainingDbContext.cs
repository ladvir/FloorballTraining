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

        //public DbSet<TrainingPart> TrainingParts { get; set; }

        //public DbSet<TrainingPartActivity> TrainingPartActivities { get; set; }

        //public DbSet<Training> Trainings { get; set; }

        //public DbSet<TrainingTrainingPart> TrainingTrainingParts { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Activity>()
                .HasMany<Tag>(s => s.Tags)
                .WithMany(c => c.Activities)
                .UsingEntity<ActivityTag>(cs =>
                {
                    cs.ToTable("ActivityTags");
                });

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


            /*
                        modelBuilder.Entity<TrainingPart>()
                            .HasMany<Activity>(s => s.Activities)
                            .WithMany(c => c.TrainingParts)
                            .UsingEntity<TrainingPartActivity>(cs =>
                            {
                                cs.ToTable("TrainingPartActivities");
                            });

                        modelBuilder.Entity<TrainingPartActivity>()
                            .HasKey(t => new { t.TrainingPartId, t.ActivityId })
                            ;

                        modelBuilder.Entity<TrainingPartActivity>()
                            .HasOne(am => am.Activity)
                            .WithMany(a => a.TrainingPartActivities)
                            .HasForeignKey(am => am.ActivityId);

                        modelBuilder.Entity<TrainingPartActivity>()
                            .HasOne(am => am.TrainingPart)
                            .WithMany(m => m.TrainingPartActivities)
                            .HasForeignKey(am => am.TrainingPartId);



                        modelBuilder.Entity<Training>()
                            .HasMany<TrainingPart>(s => s.TrainingParts)
                            .WithOne(c => c.Training)
                            ;*/


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