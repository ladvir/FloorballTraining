using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    //[PrimaryKey(nameof(TrainingPartId), nameof(TrainingGroupId))]
    public class TrainingGroup
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]

        public int TrainingGroupId { get; set; }

        public string? Name { get; set; } = string.Empty;

        public int PersonsMax { get; set; } = 30;

        public int PersonsMin { get; set; } = 1;

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new();

        public TrainingPart TrainingPart { get; set; } = null!;
        //public int TrainingPartId { get; set; }

        public TrainingGroup Clone()
        {
            var trainingGroup = new TrainingGroup
            {
                TrainingGroupId = TrainingGroupId,
                Name = Name,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                TrainingPart = TrainingPart,
                TrainingGroupActivities = new List<TrainingGroupActivity>()
            };

            foreach (var trainingGroupActivity in TrainingGroupActivities)
            {
                trainingGroup.TrainingGroupActivities.Add(
                    new TrainingGroupActivity
                    {
                        TrainingGroupId = trainingGroupActivity.TrainingGroupId,
                        ActivityId = trainingGroupActivity.ActivityId,
                        Duration = trainingGroupActivity.Duration,
                        TrainingGroupActivityId = trainingGroupActivity.TrainingGroupActivityId,
                        TrainingGroup = trainingGroupActivity.TrainingGroup
                    }
                    );
            }

            return trainingGroup;
        }

        public void Merge(TrainingGroup other)
        {
            Name = other.Name;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            TrainingGroupActivities = other.TrainingGroupActivities;
            TrainingPart = other.TrainingPart;
            //TrainingPartId = other.TrainingPartId;
        }

        public void AddTrainingGroupActivities(List<Activity> activities)
        {
            foreach (var activity in activities)
            {
                if (TrainingGroupActivities.Select(tga => tga.ActivityId).Contains(activity.ActivityId))
                {
                    continue;
                }

                TrainingGroupActivities.Add(new TrainingGroupActivity
                {
                    Activity = activity,
                    ActivityId = activity.ActivityId,
                    TrainingGroup = this,
                    TrainingGroupId = TrainingGroupId,
                    Duration = activity.DurationMax

                });
            }
        }
    }
}
