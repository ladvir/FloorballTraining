using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        private readonly NavigationStore _navigationStore;
        public ViewModelBase CurrentViewModel => _navigationStore.CurrentModelView;

        public MainViewModel(NavigationStore navigationStore)
        {
            _navigationStore = navigationStore;
            _navigationStore.CurrentViewModelChanged += OnCurrentModelViewChanged;
        }

        private void OnCurrentModelViewChanged()
        {
            OnPropertyChanged(nameof(CurrentViewModel));
        }
    }
}