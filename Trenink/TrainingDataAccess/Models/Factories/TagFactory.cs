using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TagFactory : ITagFactory
{
    public Tag GetMergedOrBuild(TagDto dto)
    {
        throw new NotImplementedException();
    }

    public Tag Build(TagDto dto)
    {
        var tag = new Tag();
        tag.Initialize(dto.TagId, dto.Name, dto.ParentTagId, dto.Color);

        return tag;
    }
}