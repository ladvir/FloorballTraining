using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    //[PrimaryKey(nameof(TrainingPartId), nameof(TrainingGroupId))]
    public class TrainingGroup
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]

        public int TrainingGroupId { get; set; }

        

        public int PersonsMax { get; set; } = 30;

        public int PersonsMin { get; set; } = 1;

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new();

        public TrainingPart TrainingPart { get; set; } = null!;


        
        public TrainingGroup Clone()
        {
            var trainingGroup = new TrainingGroup
            {
                TrainingGroupId = TrainingGroupId,
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
                        TrainingGroupActivityId = trainingGroupActivity.TrainingGroupActivityId,
                        TrainingGroup = trainingGroupActivity.TrainingGroup
                    }
                    );
            }

            return trainingGroup;
        }

        public void Merge(TrainingGroup other)
        {
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            TrainingGroupActivities = other.TrainingGroupActivities;
            TrainingPart = other.TrainingPart;
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
                    TrainingGroupId = TrainingGroupId
                });
            }
        }
    }
}
