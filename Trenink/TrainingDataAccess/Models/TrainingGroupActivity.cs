namespace TrainingDataAccess.Models
{
    public class TrainingGroupActivity
    {
        public int ActivityId { get; set; }
        public Activity Activity { get; set; } = new Activity();

        public int TrainingGroupId { get; set; }
        public TrainingGroup TrainingGroup { get; set; } = new TrainingGroup();


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

        public void Initialize(TrainingGroup trainingGroup, int activityId)
        {
            TrainingGroup = trainingGroup;
            TrainingGroupId = trainingGroup.TrainingGroupId;
            ActivityId = activityId;
        }
    }
}