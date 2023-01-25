using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace TrainingDataAccess.DbContexts
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
            var options = new DbContextOptionsBuilder()
                .UseSqlite(_connectionString)
                .LogTo(Console.WriteLine, LogLevel.Information)
                .Options;

            return new TrainingDbContext(options);
        }



    }
}