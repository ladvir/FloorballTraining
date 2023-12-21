namespace FloorballTraining.CoreBusiness.Specifications;

public class TagsWithParentTagSpecification : BaseSpecification<Tag>
{


    public TagsWithParentTagSpecification(TagSpecificationParameters parameters) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.ParentTagId.HasValue || x.ParentTag != null && x.ParentTag.Id == parameters.ParentTagId || x.ParentTagId.HasValue && x.ParentTagId == parameters.ParentTagId) &&
            (!parameters.IsTrainingGoal.HasValue || x.IsTrainingGoal == parameters.IsTrainingGoal)

        )
    {
        AddInclude(t => t.ParentTag);
        AddOrderBy(t => t.Name);

        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);

    }



    public TagsWithParentTagSpecification(int id) : base(x => x.Id == id)
    {
        AddInclude(t => t.ParentTag);
    }

    private void AddSorting(string? sort)
    {
        if (string.IsNullOrEmpty(sort)) return;

        switch (sort)
        {
            case "nameAsc":
                AddOrderBy(t => t.Name);
                break;
            case "nameDesc":
                AddOrderByDescending(t => t.Name);
                break;
            case "parentTagAsc":
                AddOrderBy(t => t.ParentTag != null ? t.ParentTag.Name : t.Name);
                break;
            case "parentTagDesc":
                AddOrderByDescending(t => t.ParentTag != null ? t.ParentTag.Name : t.Name);
                break;
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}