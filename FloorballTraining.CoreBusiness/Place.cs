using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness;

public class Place : BaseEntity
{
    public string Name { get; set; } = string.Empty;


    public int Width { get; set; } = 1;

    public int Length { get; set; } = 1;

    public Environment Environment { get; set; } = Environment.Anywhere;

    public List<Training>? Trainings { get; } = new();

    public Place Clone()
    {
        return new Place
        {
            Id = Id,
            Name = Name,
            Width = Width,
            Length = Length,
            Environment = Environment
        };
    }

    public void Merge(Place place)
    {
        Name = place.Name;
        Width = place.Width;
        Length = place.Length;
        Environment = place.Environment;
    }

    public override string ToString()
    {
        return $"{Name} - {Environment.GetDescription()} - {Length} x {Width}";
    }
}