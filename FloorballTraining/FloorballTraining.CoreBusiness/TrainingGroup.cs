using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class TrainingGroup
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int Id { get; set; }



        public int PersonsMax { get; set; } = 30;

        public int PersonsMin { get; set; } = 1;

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new();

        public TrainingPart TrainingPart { get; set; } = null!;



        public TrainingGroup Clone()
        {
            var trainingGroup = new TrainingGroup
            {
                Id = Id,
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
                        Id = trainingGroupActivity.Id,
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
                if (TrainingGroupActivities.Select(tga => tga.ActivityId).Contains(activity.Id))
                {
                    continue;
                }

                TrainingGroupActivities.Add(new TrainingGroupActivity
                {
                    Activity = activity,
                    ActivityId = activity.Id,
                    TrainingGroup = this,
                    TrainingGroupId = Id
                });
            }
        }
    }
}
