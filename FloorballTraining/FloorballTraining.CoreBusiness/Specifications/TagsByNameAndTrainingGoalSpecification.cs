namespace FloorballTraining.CoreBusiness.Specifications;

public class TagsByNameAndTrainingGoalSpecification : BaseSpecification<Tag>
{

    public TagsByNameAndTrainingGoalSpecification(string? searchText, bool? isTrainingGoal)
        : base(x =>
            (!isTrainingGoal.HasValue || x.IsTrainingGoal == isTrainingGoal)
            && (string.IsNullOrEmpty(searchText) || x.Name.ToLower().Contains(searchText.ToLower())))
    {

    }
}