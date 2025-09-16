namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityBaseDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public int PersonsMin { get; set; } = 1;

    public int PersonsMax { get; set; }
    public int GoaliesMin { get; set; }

    public int GoaliesMax { get; set; }

    public int DurationMin { get; set; } = 1;
    public int DurationMax { get; set; }

    public int Intensity { get; set; }

    public int Difficulty { get; set; }

    public int PlaceWidth { get; set; } = 8;

    public int PlaceLength { get; set; } = 10;

    public string Environment { get; set; } = string.Empty;
}

public class ActivityNameAndDescriptionDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;
}