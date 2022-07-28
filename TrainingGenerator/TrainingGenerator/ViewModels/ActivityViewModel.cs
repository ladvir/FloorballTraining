using TrainingGenerator.Models;

namespace TrainingGenerator.ViewModels
{
    public class ActivityViewModel : ViewModelBase
    {
        private readonly Activity _activity;
        public int Id => _activity.Id;
        public string Name => _activity.Name;
        public string Description => _activity.Description;
        public double? Rating => _activity.Rating;
        public int? Duration => _activity.Duration;
        public int? PersonsMin => _activity.PersonsMin;
        public int? PersonsMax => _activity.PersonsMax;

        public ActivityViewModel(Activity activity)
        {
            _activity = activity;
        }
    }
}