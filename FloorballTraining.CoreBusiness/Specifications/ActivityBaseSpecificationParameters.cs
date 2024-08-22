namespace FloorballTraining.CoreBusiness.Specifications;

public class ActivityBaseSpecificationParameters
{
    private const int MaxPageSize = 150;

    public int PageIndex { get; set; } = 1;

    private int _pageSize = 150;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = (value > MaxPageSize ? MaxPageSize : value);
    }

    public int? Id { get; set; }

    public string? Text { get; set; }
    public string? Name { get; set; }

    public string? Description { get; set; }

    public int? PersonsMin { get; set; }

    public int? PersonsMax { get; set; }
    public int? GoaliesMin { get; set; }

    public int? GoaliesMax { get; set; }

    public int? DurationMin { get; set; }
    public int? DurationMax { get; set; }

    public int? Intensity { get; set; }

    public int? Difficulty { get; set; }

    public int? PlaceWidth { get; set; }

    public int? PlaceLength { get; set; }

    public string? Environment { get; set; }

    public string? Sort { get; set; }
    public int? IntensityMin { get; set; }
    public int? IntensityMax { get; set; }
    public int? DifficultyMin { get; set; }
    public int? DifficultyMax { get; set; }
    public int? PlaceWidthMin { get; set; }
    public int? PlaceWidthMax { get; set; }
    public int? PlaceLengthMin { get; set; }
    public int? PlaceLengthMax { get; set; }
    public long? PlaceAreaMin { get; set; }
    public long? PlaceAreaMax { get; set; }

    public int? Persons { get; set; }
    public int? Goalies { get; set; }
    public int? Duration { get; set; }
    public long? PlaceArea { get; set; }
}