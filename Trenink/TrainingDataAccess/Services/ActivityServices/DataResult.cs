namespace TrainingDataAccess.Services.ActivityServices
{
    public class DataResult<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public int Count { get; set; }
    }
}
