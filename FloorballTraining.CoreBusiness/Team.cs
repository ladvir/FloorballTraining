namespace FloorballTraining.CoreBusiness
{
    public class Team : BaseEntity
    {
        public string Name { get; set; } = null!;

        public AgeGroup? AgeGroup { get; set; }
        public int AgeGroupId { get; set; }

        public Club? Club { get; set; }
        public int ClubId { get; set; }

        public List<Appointment> Appointments { get; set; } = [];

        public List<TeamMember> TeamMembers { get; set; } = [];
        
       

        public Team Clone()
        {
            return new Team
            {
                Id = Id,
                Name = Name
            };
        }

        public void Merge(Team team)
        {
            Name = team.Name;

            AgeGroup = team.AgeGroup;
            AgeGroupId = team.AgeGroupId;
            Club = team.Club;
            ClubId = team.ClubId;

        }
    }
}