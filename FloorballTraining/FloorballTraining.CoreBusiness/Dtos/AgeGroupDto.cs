namespace FloorballTraining.CoreBusiness.Dtos;

public class AgeGroupDto : BaseEntityDto
{
    public const string AnyAge = "Kdokoliv";

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsAnyAge()
    {
        return Name == AnyAge;
    }
}