namespace FloorballTraining.CoreBusiness.Specifications
{
    public class TagSpecificationParameters
    {
        private const int MaxPageSize = 50;

        public int PageIndex { get; set; } = 1;

        private int _pageSize = 6;

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize ? MaxPageSize : value);
        }

        public int? Id { get; set; }
        public string? Name { get; set; }

        public int? ParentTagId { get; set; }

        public bool? IsTrainingGoal { get; set; }

        public string? Sort { get; set; }
    }
}
