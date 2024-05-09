namespace FloorballTraining.CoreBusiness.Dtos
{
    public class AppSettings
    {
        public int MaxTrainingDuration { get; set; }
        public int MaximalLengthTrainingName { get; set; }
        public int MaximalLengthTrainingDescription { get; set; }
        public int MaximalPersons { get; set; }

        public int MaxActivityDuration { get; set; }

        public int MaxTrainingPartDuration { get; set; }
        public int MaximalLengthTrainingPartName { get; set; }
        public int MaximalLengthTrainingPartDescription { get; set; }

        public int MaximalLengthTrainingGroupName { get; set; }


        public int MinimalDurationTrainingGoalPercent { get; set; }


        public int MaximalLengthTeamName { get; set; }
        public int MaximalLengthClubName { get; set; }

        public int MaximalLengthMemberFirstName { get; set; }

        public int MaximalLengthMemberLastName { get; set; }

        public string AssetsPath { get; set; } = string.Empty;

    }
}
