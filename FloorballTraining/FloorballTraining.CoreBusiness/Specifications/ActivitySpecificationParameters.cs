namespace FloorballTraining.CoreBusiness.Specifications;

public class ActivitySpecificationParameters : ActivityBaseSpecificationParameters
{
    public string? Tag { get; set; }
    public string? Equipment { get; set; }

    public string? AgeGroup { get; set; }
}