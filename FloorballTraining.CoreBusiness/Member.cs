using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness
{
    public class Member : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public int BirthYear { get; set; }

        public bool IsActive { get; set; } = true;

        public Gender? Gender { get; set; }

        public string Email { get; set; } = string.Empty;

        public string? AppUserId { get; set; }

        public bool HasClubRoleManager { get; set; }
        public bool HasClubRoleSecretary { get; set; }
        public bool HasClubRoleMainCoach { get; set; }
        public bool HasClubRoleCoach { get; set; }
        public Club? Club { get; set; }
        public int ClubId { get; set; }

        public List<TeamMember> TeamMembers { get; set; } = new();

        public List<TestResult> TestResults { get; set; } = new();

        public void Merge(Member member)
        {
            FirstName = member.FirstName;
            LastName = member.LastName;
            BirthYear = member.BirthYear;
            IsActive = member.IsActive;
            Gender = member.Gender;
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
