namespace TrainingDataAccess.DbContexts
{
    public class TrainingDesignTimeDbContextFactory : IDesignTimeDbContextFactory<TrainingDbContext>
    {
        public TrainingDbContext CreateDbContext(string[] args)
        {
            var options = new DbContextOptionsBuilder().UseSqlite("Data Source=training.db").Options;

            return new TrainingDbContext(options);
        }
    }
}