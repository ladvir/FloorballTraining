
namespace FloorballTraining.CoreBusiness
{
    public class Club : BaseEntity
    {
        public string Name { get; set; } = null!;

        public string? MaxRegistrationRole { get; set; } = "User";

        public List<Team> Teams { get; set; } = new();

        public List<Member> Members { get; set; } = new();

        public void Merge(Club club)
        {
            Id = club.Id;
            Name = club.Name;
            MaxRegistrationRole = club.MaxRegistrationRole;
            Teams = club.Teams;
            Members = club.Members;
        }
    }
}