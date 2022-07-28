using Microsoft.EntityFrameworkCore;
using TrainingGenerator.Dtos;

namespace TrainingGenerator.DbContexts
{
    public class TrainingDbContext : DbContext
    {
        public TrainingDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<ActivityDTO> Activities { get; set; }
    }
}