namespace FloorballTraining.CoreBusiness;

public class Season : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<Team> Teams { get; set; } = [];
        
    public Season Clone()
    {
        return new Season
        {
            Id = Id,
            Name = Name,
            StartDate = StartDate,
            EndDate = EndDate,
            Teams = Teams
        };
    }
        
    public void Merge(Season season)
    {
        Name = season.Name;
        StartDate = season.StartDate;
        EndDate = season.EndDate;
        Teams = season.Teams;
    }
        
}