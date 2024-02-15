namespace FloorballTraining.CoreBusiness
{
    public class Tag : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Color { get; set; } = "#858791";


        public int? ParentTagId { get; set; }

        public Tag? ParentTag { get; set; }

        public bool IsTrainingGoal { get; set; }

        public List<ActivityTag> ActivityTags { get; set; } = new();

        public List<Training> Trainings1 { get; set; } = new();
        public List<Training> Trainings2 { get; set; } = new();
        public List<Training> Trainings3 { get; set; } = new();

        public Tag Clone()
        {
            return new Tag
            {
                Id = Id,
                Name = Name,
                Color = Color,
                ParentTagId = ParentTagId,
                ParentTag = ParentTag,
                IsTrainingGoal = IsTrainingGoal
            };
        }

        public void Merge(Tag tag)
        {
            Name = tag.Name;
            Color = tag.Color;
            ParentTag = tag.ParentTag;
            ParentTagId = tag.ParentTagId;
            IsTrainingGoal = tag.IsTrainingGoal;
        }

    }
}