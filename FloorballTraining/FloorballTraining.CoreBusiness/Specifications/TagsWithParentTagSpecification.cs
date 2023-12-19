namespace FloorballTraining.CoreBusiness.Specifications;

public class TagsWithParentTagSpecification : BaseSpecification<Tag>
{
    public TagsWithParentTagSpecification()
    {
        AddInclude(t => t.ParentTag);
    }

    public TagsWithParentTagSpecification(int id) : base(x => x.Id == id)
    {
        AddInclude(t => t.ParentTag);
    }
}

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

public class TagsByNameAndTrainingGoalSpecification : BaseSpecification<Tag>
{

    public TagsByNameAndTrainingGoalSpecification(string? searchText, bool? isTrainingGoal)
        : base(x =>
            (!isTrainingGoal.HasValue || x.IsTrainingGoal == isTrainingGoal)
             && (string.IsNullOrEmpty(searchText) || x.Name.ToLower().Contains(searchText.ToLower())))
    {

    }
}