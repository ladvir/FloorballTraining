using TrainingGenerator.Models;

namespace TrainingGenerator.ViewModels
{
    public class TrainingActivityViewModel : ViewModelBase
    {
        private readonly TrainingActivity _trainingActivity;

        public TrainingActivityViewModel(TrainingActivity trainingActivity)
        {
            _trainingActivity = trainingActivity;
        }

        public TrainingActivity TrainingActivity => _trainingActivity;
    }
}