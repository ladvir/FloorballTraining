using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness
{
    public class Member : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public ClubRole ClubRole { get; set; }
        public Club? Club { get; set; }
        public int ClubId { get; set; }



        public List<TeamMember> TeamsMember { get; set; } = new();

        public Team Clone()
        {
            return new Team
            {
                Id = Id,
                Name = Name
            };
        }

        public void Merge(Member member)
        {
            Name = member.Name;
            Email = member.Email;
            ClubRole = member.ClubRole;
            TeamsMember = member.TeamsMember;
        }
    }


}