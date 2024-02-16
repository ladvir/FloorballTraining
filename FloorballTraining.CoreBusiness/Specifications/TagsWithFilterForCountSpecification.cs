namespace FloorballTraining.CoreBusiness.Specifications;

public class TagsWithFilterForCountSpecification : BaseSpecification<Tag>
{
    public TagsWithFilterForCountSpecification(TagSpecificationParameters parameters) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.ParentTagId.HasValue || x.ParentTag != null && x.ParentTag.Id == parameters.ParentTagId ||
             x.ParentTagId.HasValue && x.ParentTagId == parameters.ParentTagId) &&
            (!parameters.IsTrainingGoal.HasValue || x.IsTrainingGoal == parameters.IsTrainingGoal)

    )
    {

    }

}