namespace TrainingDataAccess.Dtos
{
    public class PaginationDTO
    {
        public int Page { get; set; } = 1;
        public int ItemsPerPage { get; set; } = 10;
    }
}
