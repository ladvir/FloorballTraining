using System;
using System.Threading.Tasks;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class LoadActivityCommand : AsyncCommandBase
    {
        private readonly TeamStore _teamStore;
        private readonly ActivityListingViewModel _activityListingViemModel;

        public LoadActivityCommand(TeamStore teamStore, ActivityListingViewModel activityViemModel)
        {
            _teamStore = teamStore;
            _activityListingViemModel = activityViemModel;
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _activityListingViemModel.ErrorMessage = string.Empty;
            _activityListingViemModel.IsLoading = true;

            try
            {
                await _teamStore.Load();
                _activityListingViemModel.ListActivities(_teamStore.Activities);
            }
            catch (Exception e)
            {
                _activityListingViemModel.ErrorMessage = $"Chyba při načítání aktivity z databáze  - {e.Message}";
            }

            _activityListingViemModel.IsLoading = false;
        }
    }
}