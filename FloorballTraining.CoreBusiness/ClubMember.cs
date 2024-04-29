namespace FloorballTraining.CoreBusiness
{
    public class ClubMember : BaseEntity
    {
        public Club? Club { get; set; }
        public int? ClubId { get; set; }

        public Member? Member { get; set; }
        public int? MemberId { get; set; }
    }
}