namespace FloorballTraining.CoreBusiness.Specifications;

public class TagsWithParentTagByNameAndTrainingGoalSpecification : BaseSpecification<Tag>
{
    public TagsWithParentTagByNameAndTrainingGoalSpecification()
    {
        AddInclude(t => t.ParentTag);
    }

    public TagsWithParentTagByNameAndTrainingGoalSpecification(string searchText, bool isTrainingGoal)
        : base(x =>
            x.IsTrainingGoal == isTrainingGoal
            & x.Name.ToLower().Contains(searchText.ToLower()))
    {
        AddInclude(t => t.ParentTag);
    }
}