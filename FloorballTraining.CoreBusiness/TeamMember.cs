namespace FloorballTraining.CoreBusiness
{
    public class TeamMember : BaseEntity
    {

        public int? TeamId { get; set; }
        public Team? Team { get; set; }
        public bool IsCoach { get; set; }
        public bool IsPlayer { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; } = null!;

        public void Merge(TeamMember member)
        {
            Team = member.Team;
            IsCoach = member.IsCoach;
            IsPlayer = member.IsPlayer;
            Member = member.Member;
            TeamId = member.TeamId;
            MemberId = member.MemberId;
        }
    }
}