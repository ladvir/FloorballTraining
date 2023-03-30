using System.ComponentModel.DataAnnotations;

namespace TrainingDataAccess.Models
{
    public class TrainingGroupActivity
    {
        [Key] public int TrainingGroupActivityId { get; set; } = default!;

        public int ActivityId { get; set; }
        public Activity Activity { get; set; } = null!;

        public int TrainingGroupId { get; set; }
        public TrainingGroup TrainingGroup { get; set; } = null!;


        public static TrainingGroupActivity Create(TrainingGroup trainingGroup, Activity activity)
        {
            var trainingGroupActivity = new TrainingGroupActivity();
            trainingGroupActivity.Initialize(trainingGroup, activity);
            return trainingGroupActivity;
        }

        public void Initialize(TrainingGroup trainingGroup, Activity activity)
        {
            TrainingGroup = trainingGroup;
            TrainingGroupId = trainingGroup.TrainingGroupId;
            Activity = activity;
            ActivityId = activity.ActivityId;
        }
    }
}