namespace TrainingDataAccess.Services.ActivityServices
{
    public class DataResult<T>
    {
        public IEnumerable<T> Items { get; set; }
        public int Count { get; set; }
    }
}
