using Microsoft.EntityFrameworkCore;
using TrainingGenerator.Models;

namespace TrainingGenerator.DbContexts
{
    public class TrainingDbContext : DbContext
    {
        public TrainingDbContext(DbContextOptions options) : base(options)
        {
            //Database.EnsureDeleted();
            //Database.EnsureCreated();
        }

        public DbSet<Activity> Activities { get; set; }
        public DbSet<Training> Trainings { get; set; }

        public DbSet<TrainingActivity> TrainingActivities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Training>().HasMany<TrainingActivity>(s => s.TrainingActivities).WithOne(s => s.Training).HasForeignKey(s => s.TrainingId);
        }
    }
}