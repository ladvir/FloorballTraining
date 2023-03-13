namespace TrainingDataAccess.Dtos;

public class TagDto
{
    public const string CustomRootTagName = @"Vlastní";

    public const string DefaultColor = "#666666;";
    public int TagId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int? ParentTagId { get; set; }

    public string Color { get; set; } = DefaultColor;

    public TagDto() { }

    public TagDto(string name)
    {
        Name = name;
    }

    public TagDto(TagDto tag)
    {
        TagId = tag.TagId;
        Name = tag.Name;
        ParentTagId = tag.ParentTagId;
        Color = tag.Color;
        ParentTag = tag.ParentTag;
        Children = tag.Children;
    }


    public TagDto? ParentTag { get; set; }

    public List<TagDto>? Children { get; set; }

    public TagDto Root
    {
        get
        {
            var node = this;

            while (node.ParentTag != null)
            {
                node = node.ParentTag;
            }
            return node;
        }
    }

    public bool IsLeaf => Children?.Count == 0;

    public int Level
    {
        get
        {
            if (IsRoot) return 0;
            if (ParentTag != null) return ParentTag.Level + 1;
            return 0;
        }
    }

    public bool IsExpanded { get; set; }

    public bool IsCustomRoot => (IsRoot && Name == CustomRootTagName);
    public bool IsRoot => ParentTagId == null;


    public override string ToString()
    {
        return Name;
    }
}