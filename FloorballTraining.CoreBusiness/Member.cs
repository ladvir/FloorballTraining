namespace FloorballTraining.CoreBusiness
{
    public class Member : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AppUserId { get; set; }

        public bool HasClubRoleManager { get; set; }
        public bool HasClubRoleSecretary { get; set; }
        public bool HasClubRoleMainCoach { get; set; }
        public bool HasClubRoleCoach { get; set; }
        public Club? Club { get; set; }
        public int ClubId { get; set; }

        public List<TeamMember> TeamMembers { get; set; } = new();

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
            AppUserId = member.AppUserId;
            HasClubRoleMainCoach = member.HasClubRoleMainCoach;
            HasClubRoleCoach = member.HasClubRoleCoach;
            HasClubRoleManager = member.HasClubRoleManager;
            HasClubRoleSecretary = member.HasClubRoleSecretary;
            TeamMembers = member.TeamMembers;
        }
    }
}