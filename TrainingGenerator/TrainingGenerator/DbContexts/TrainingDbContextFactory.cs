using Microsoft.EntityFrameworkCore;

namespace TrainingGenerator.DbContexts
{
    public class TrainingDbContextFactory
    {
        private readonly string _connectionString;

        public TrainingDbContextFactory(string connectionString)
        {
            _connectionString = connectionString;
        }

        public TrainingDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder().UseSqlite(_connectionString).Options;

            return new TrainingDbContext(options);
        }
    }
}