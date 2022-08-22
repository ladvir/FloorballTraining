using System;
using System.Threading.Tasks;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class LoadTrainingCommand : AsyncCommandBase
    {
        private readonly TeamStore _teamStore;
        private readonly TrainingListingViewModel _trainingListingViemModel;

        public LoadTrainingCommand(TeamStore teamStore, TrainingListingViewModel trainingListingViewModel)
        {
            _teamStore = teamStore;
            _trainingListingViemModel = trainingListingViewModel;
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _trainingListingViemModel.ErrorMessage = string.Empty;
            _trainingListingViemModel.IsLoading = true;

            try
            {
                await _teamStore.LoadTrainings();
                _trainingListingViemModel.ListTrainings(_teamStore.Trainings);
            }
            catch (Exception e)
            {
                _trainingListingViemModel.ErrorMessage = $"Chyba při načítání tréninku z databáze  - {e.Message}";
            }

            _trainingListingViemModel.IsLoading = false;
        }
    }
}