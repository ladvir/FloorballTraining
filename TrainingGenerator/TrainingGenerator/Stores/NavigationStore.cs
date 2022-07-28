using System;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Stores
{
    public class NavigationStore
    {
        private ViewModelBase _currentModelView;

        public ViewModelBase CurrentModelView
        {
            get => _currentModelView;
            set
            {
                _currentModelView = value;
                OnCurrentModelViewChanged();
            }
        }

        public event Action CurrentViewModelChanged;

        private void OnCurrentModelViewChanged()
        {
            CurrentViewModelChanged?.Invoke();
        }
    }
}