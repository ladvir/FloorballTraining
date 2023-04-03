using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class ActivityTagFactory : IActivityTagFactory
{

    private readonly TagFactory _tagFactory;

    public ActivityTagFactory(TagFactory tagFactory)
    {
        _tagFactory = tagFactory;
    }

    public Tag GetMergedOrBuild(TagDto dto)
    {
        throw new NotImplementedException();
    }

    public ActivityTag Build(ActivityTagDto dto)
    {
        var activityTag = new ActivityTag();

        activityTag.Initialize(dto.ActivityId, dto.TagId);

        activityTag.Tag = _tagFactory.Build(dto.Tag);

        return activityTag;
    }
}