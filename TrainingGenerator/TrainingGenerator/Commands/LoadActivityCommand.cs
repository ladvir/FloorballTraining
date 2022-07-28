using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows;
using TrainingGenerator.Models;
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
            _activityListingViemModel.IsLoading = true;

            try
            {
                await _teamStore.Load();
                _activityListingViemModel.UpdateActivities(_teamStore.Activities);
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při načítání aktivity z databáze  - {e.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            _activityListingViemModel.IsLoading = false;
        }
    }
}