namespace FloorballTraining.CoreBusiness
{
    public class Team : BaseEntity
    {
        public string Name { get; set; } = null!;

        public AgeGroup? AgeGroup { get; set; }
        public int AgeGroupId { get; set; }

        public Club? Club { get; set; }
        public int ClubId { get; set; }

        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }
        public int? DefaultTrainingDuration { get; set; }
        public int? MaxTrainingDuration { get; set; }
        public int? MaxTrainingPartDuration { get; set; }
        public int? MinPartsDurationPercent { get; set; }

        public List<Appointment> Appointments { get; set; } = [];

        public List<TeamMember> TeamMembers { get; set; } = [];

        public Team Clone()
        {
            return new Team
            {
                Id = Id,
                Name = Name,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                DefaultTrainingDuration = DefaultTrainingDuration,
                MaxTrainingDuration = MaxTrainingDuration,
                MaxTrainingPartDuration = MaxTrainingPartDuration,
                MinPartsDurationPercent = MinPartsDurationPercent,
            };
        }

        public void Merge(Team team)
        {
            Name = team.Name;

            AgeGroup = team.AgeGroup;
            AgeGroupId = team.AgeGroupId;
            Club = team.Club;
            ClubId = team.ClubId;

            PersonsMin = team.PersonsMin;
            PersonsMax = team.PersonsMax;
            DefaultTrainingDuration = team.DefaultTrainingDuration;
            MaxTrainingDuration = team.MaxTrainingDuration;
            MaxTrainingPartDuration = team.MaxTrainingPartDuration;
            MinPartsDurationPercent = team.MinPartsDurationPercent;
        }
    }
}