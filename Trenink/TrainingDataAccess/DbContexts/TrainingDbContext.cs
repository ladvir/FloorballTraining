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

        public DbSet<ActivityTag> ActivityTags { get; set; }


        //public DbSet<Training> Trainings { get; set; }

        //public DbSet<TrainingActivity> TrainingActivities { get; set; }




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //Configure default schema
            //modelBuilder.HasDefaultSchema("Admin");


            //modelBuilder.Entity<Activity>().ToTable("Activities");
            //modelBuilder.Entity<Tag>().ToTable("Tags");
            //modelBuilder.Entity<ActivityTag>().ToTable("ActivityTags");


            /*          modelBuilder.Entity<Activity>()
                          .HasMany<ActivityTag>()
                          .WithOne(at => at.Activity).HasForeignKey(t => t.ActivityId);
          */

            /*odelBuilder.Entity<Student>()
                  .HasMany<Course>(s => s.Courses)
                  .WithMany(c => c.Students)
                  .Map(cs =>
                          {
                              cs.MapLeftKey("StudentRefId");
                              cs.MapRightKey("CourseRefId");
                              cs.ToTable("StudentCourse");
                          });*/

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