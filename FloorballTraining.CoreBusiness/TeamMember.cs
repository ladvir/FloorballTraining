using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness
{
    public class TeamMember : BaseEntity
    {

        public int TeamId { get; set; }
        public Team? Team { get; set; }

        public TeamRole TeamRole { get; set; }

        public int MemberId { get; set; }
        public Member? Member { get; set; }
    }
}