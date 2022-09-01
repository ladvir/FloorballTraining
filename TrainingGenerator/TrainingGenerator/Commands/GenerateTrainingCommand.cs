using System;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Windows;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class GenerateTrainingCommand : CommandBase
    {
        private readonly AddTrainingViewModel _addTrainingViewModel;
        private readonly NavigationService<TrainingListingViewModel> _TrainingListingNavigationService;
        private readonly TeamStore _teamStore;

        public GenerateTrainingCommand(TeamStore teamStore, AddTrainingViewModel addTrainingViewModel)
        {
            _addTrainingViewModel = addTrainingViewModel;
            _teamStore = teamStore;

            _addTrainingViewModel.PropertyChanged += OnViewModelPropertyChanged;
        }

        private void OnViewModelPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(AddTrainingViewModel.CanSave))
            {
                OnCanExecutedChanged();
            }
        }

        public override bool CanExecute(object parameter)
        {
            return _addTrainingViewModel.CanGenerate && base.CanExecute(parameter);
        }

        public override void Execute(object parameter)
        {
            _addTrainingViewModel.SubmitErrorMessage = string.Empty;
            _addTrainingViewModel.IsGenerating = true;

            try
            {
                _addTrainingViewModel.GetRandomActivities(_addTrainingViewModel.Duration, _addTrainingViewModel.PersonsMax, _addTrainingViewModel.FlorbalPercent);
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při ukládání nového tréninku aktivity - {e.Message} - {e.InnerException?.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            _addTrainingViewModel.IsGenerating = false;
        }
    }
}