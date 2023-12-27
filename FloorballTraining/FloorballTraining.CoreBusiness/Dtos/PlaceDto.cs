namespace FloorballTraining.CoreBusiness.Dtos;

public class PlaceDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public int Width { get; set; }
    public int Length { get; set; }

    public string Environment { get; set; } = string.Empty;

    public override string ToString()
    {
        return $"{Name} - {Environment} - {Length} x {Width}";
    }
}