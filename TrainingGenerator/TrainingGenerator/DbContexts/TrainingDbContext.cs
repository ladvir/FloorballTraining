using Microsoft.EntityFrameworkCore;
using TrainingGenerator.Dtos;

namespace TrainingGenerator.DbContexts
{
    public class TrainingDbContext : DbContext
    {
        public TrainingDbContext(DbContextOptions options) : base(options)
        {
            Database.EnsureCreated();
        }

        public DbSet<ActivityDTO> Activities { get; set; }
        public DbSet<TrainingDTO> Trainings { get; set; }

        public DbSet<TrainingActivityDTO> TrainingActivities { get; set; }
    }
}